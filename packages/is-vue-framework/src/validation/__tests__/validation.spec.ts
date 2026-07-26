import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { fromZod, inferFieldLayers, requiredSchemaKeys } from '../zod'
import { assertNoHiddenRequiredFields, selectSchema, validateDraft } from '../select'
import { resolveFields } from '../../fields'
import type { ValidationSchema } from '../../contracts'

const createSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email(),
  address: z.object({ city: z.string() }),
  tags: z.array(z.string().min(1)),
  note: z.string().optional(),
})

const passwordSchema = z
  .object({ password: z.string(), confirmation: z.string() })
  .refine((value) => value.password === value.confirmation, { message: 'Konfirmasi tidak cocok', path: ['confirmation'] })

describe('zod bridge', () => {
  it('returns parsed data on success', () => {
    const schema = fromZod<{ name: string }>(z.object({ name: z.string() }))

    expect(schema.validate({ name: 'Admin' })).toEqual({ success: true, data: { name: 'Admin' } })
  })

  it('normalizes scalar, nested, array, and root issues with their paths', () => {
    const result = fromZod(createSchema).validate({ name: 'ab', email: 'nope', address: {}, tags: [''] })

    expect(result.success).toBe(false)
    if (result.success) return

    const paths = result.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'address.city', 'tags.0']))
    expect(result.issues.find((issue) => issue.path.join('.') === 'name')?.message).toBe('Nama minimal 3 karakter')
  })

  it('reports every issue rather than only the first', () => {
    const result = fromZod(createSchema).validate({})

    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.length).toBeGreaterThan(1)
  })

  it('keeps cross-field refine errors on their declared path', () => {
    const result = fromZod(passwordSchema).validate({ password: 'a', confirmation: 'b' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues).toEqual([{ path: ['confirmation'], message: 'Konfirmasi tidak cocok' }])
  })

  it('reports required keys for the hidden-but-required diagnostic', () => {
    expect(requiredSchemaKeys(createSchema).sort()).toEqual(['address', 'email', 'name', 'tags'])
    expect(requiredSchemaKeys(z.string())).toEqual([])
  })

  it('infers renderers from schema metadata without copying constraints', () => {
    const layers = inferFieldLayers(
      z.object({
        name: z.string().min(3),
        age: z.number().optional(),
        active: z.boolean(),
        status: z.enum(['open', 'closed']),
      }),
    )

    expect(layers.name).toEqual({ renderer: 'text' })
    expect(layers.age).toEqual({ renderer: 'number' })
    expect(layers.active).toEqual({ renderer: 'switch' })
    expect(layers.status).toEqual({ renderer: 'select', props: { options: ['open', 'closed'] } })
  })

  it('feeds inferred metadata into field resolution as the schema layer', () => {
    const [field] = resolveFields({
      fields: { status: { label: 'Status' } },
      surface: 'form',
      schema: inferFieldLayers(z.object({ status: z.enum(['open', 'closed']) })),
    })

    expect(field.renderer).toBe('select')
    expect(field.props).toEqual({ options: ['open', 'closed'] })
  })

  it('changes validation when the schema changes, with no renderer edit', () => {
    const fields = { name: { form: { renderer: 'text' } } }
    const strict = fromZod(z.object({ name: z.string().min(5) }))
    const loose = fromZod(z.object({ name: z.string() }))

    expect(strict.validate({ name: 'abc' }).success).toBe(false)
    expect(loose.validate({ name: 'abc' }).success).toBe(true)
    expect(resolveFields({ fields, surface: 'form' })[0].renderer).toBe('text')
  })
})

describe('schema selection', () => {
  const explicit = fromZod(z.object({ source: z.literal('explicit') }))
  const resource = fromZod(z.object({ source: z.literal('resource') }))
  const derived = fromZod(z.object({ source: z.literal('rpc') }))
  const manual = fromZod(z.object({ source: z.literal('manual') }))
  const adapter = { find: (_resource: string, operation: string) => (operation === 'create' ? derived : undefined) }

  it('prefers an explicit component schema', () => {
    expect(
      selectSchema({ explicit, resource, manual, adapter: { adapter, resourceKey: 'users', operation: 'create' } }),
    ).toBe(explicit)
  })

  it('falls back to the resource operation schema', () => {
    expect(selectSchema({ resource, manual, adapter: { adapter, resourceKey: 'users', operation: 'create' } })).toBe(resource)
  })

  it('falls back to the RPC-derived schema', () => {
    expect(selectSchema({ manual, adapter: { adapter, resourceKey: 'users', operation: 'create' } })).toBe(derived)
  })

  it('falls back to a manual schema when no metadata exists', () => {
    expect(selectSchema({ manual, adapter: { adapter, resourceKey: 'users', operation: 'update' } })).toBe(manual)
    expect(selectSchema({ manual })).toBe(manual)
  })

  it('returns undefined when nothing is available', () => {
    expect(selectSchema({})).toBeUndefined()
  })
})

describe('draft validation', () => {
  it('validates the visibility-filtered draft', () => {
    const schema = fromZod(z.object({ mode: z.string(), cause: z.string().optional() }))

    expect(validateDraft({ schema, draft: { mode: 'a' } }).success).toBe(true)
  })

  it('accepts any draft when no schema is available', () => {
    expect(validateDraft({ draft: { anything: true } })).toEqual({ success: true, data: { anything: true } })
  })

  it('diagnoses a schema-required field hidden by behavior', () => {
    const schema = fromZod(z.object({ mode: z.string(), cause: z.string() }))

    expect(() => validateDraft({ schema, draft: { mode: 'a' }, hiddenKeys: ['cause'] })).toThrow(
      'required by the schema but hidden by behavior',
    )
  })

  it('accepts a hidden field the schema treats as optional', () => {
    const schema = fromZod(z.object({ mode: z.string(), cause: z.string().optional() }))

    expect(() => assertNoHiddenRequiredFields(schema, ['cause'])).not.toThrow()
  })

  it('ignores the diagnostic for schemas without key metadata', () => {
    const opaque: ValidationSchema = { validate: () => ({ success: true, data: {} }) }

    expect(() => assertNoHiddenRequiredFields(opaque, ['cause'])).not.toThrow()
  })
})
