import { afterEach, describe, expect, it } from 'vitest'
import type { CollectionResult, WebResourceSchema } from '../../contracts'
import { createFrameworkQueryClient } from '../../query/client'
import { resolveFrameworkAdapters } from '../../adapters/projectAdapters'
import { resolveFrameworkFieldDefaults } from '../../fields/defaults'
import { defineFields } from '../../fields/defineFields'
import { defineResource } from '../defineResource'
import { defineSchema } from '../defineSchema'
import { resetResourceActionRegistry } from '../routeAccess'
import { registerResourceRuntime, resetResourceRuntimeForTests } from '../runtime'

type Row = { id: string; name: string }
type Draft = { name: string }
type Schema = WebResourceSchema<Row, Record<string, never>, Draft, Draft, string>

const schema = defineSchema<Schema>({ identity: 'id' })
const fields = defineFields(schema, {
  name: { label: 'Name', table: { sortable: true }, form: { renderer: 'text' } },
})

function resource(access = { allows: () => true }) {
  registerResourceRuntime({
    queryClient: createFrameworkQueryClient(),
    adapters: resolveFrameworkAdapters({ access }),
    fieldDefaults: resolveFrameworkFieldDefaults(),
  })
  return defineResource(schema, {
    key: 'records',
    actions: {
      list: {
        run: async (): Promise<CollectionResult<Row>> => ({ data: [{ id: '1', name: 'One' }] }),
        fields: [fields.name],
        permission: 'records.list',
        route: { name: 'records-list' },
      },
      detail: {
        run: async ({ id }) => ({ id, name: 'One' }),
        fields: [fields.name],
        permission: 'records.detail',
        route: { name: 'records-detail', params: (id) => ({ id }) },
      },
      create: {
        run: async (input) => ({ id: '2', ...input }),
        fields: [fields.name],
        permission: 'records.create',
        route: { name: 'records-create' },
      },
      update: {
        run: async (id, input) => ({ id, name: input.name }),
        fields: [fields.name],
        permission: 'records.update',
        route: { name: 'records-edit', params: (id) => ({ id }) },
      },
      delete: {
        run: async () => undefined,
        permission: 'records.delete',
      },
      verify: { run: async (id: string, result: 'approved' | 'rejected') => `${id}:${result}` },
    },
  })
}

afterEach(() => {
  resetResourceRuntimeForTests()
  resetResourceActionRegistry()
})

describe('action resources', () => {
  it('builds standard surfaces and keeps custom actions explicit', async () => {
    const value = resource()
    const list = value.list()
    const record = { id: '1', name: 'One' }

    expect(list.fields).toEqual([expect.objectContaining({ key: 'name', label: 'Name', table: { sortable: true }, form: { renderer: 'text' } })])
    expect(list.createRoute).toEqual({ name: 'records-create' })
    expect(list.detailRoute?.(record)).toEqual({ name: 'records-detail', params: { id: '1' } })
    expect(list.updateRoute?.(record)).toEqual({ name: 'records-edit', params: { id: '1' } })
    expect(list.canDelete?.(record)).toBe(true)
    await expect(value.actions.verify.run('1', 'approved')).resolves.toBe('1:approved')
    await expect(value.create().run({ name: 'Two' })).resolves.toEqual({ id: '2', name: 'Two' })
    expect(value.create().defaultTo?.({ id: '2', name: 'Two' })).toEqual({ name: 'records-detail', params: { id: '2' } })
    expect(value.update({ id: '1' }).defaultTo?.({ id: '1', name: 'One' })).toEqual({ name: 'records-detail', params: { id: '1' } })
  })

  it('lets create and update replace or clear the detail defaultTo', () => {
    registerResourceRuntime({
      queryClient: createFrameworkQueryClient(),
      adapters: resolveFrameworkAdapters(),
      fieldDefaults: resolveFrameworkFieldDefaults(),
    })
    const list = { name: 'records-list' }
    const value = defineResource(schema, {
      key: 'records-override',
      actions: {
        detail: {
          run: async ({ id }) => ({ id, name: 'One' }),
          route: { name: 'records-detail', params: (id) => ({ id }) },
        },
        create: {
          run: async (input) => ({ id: '2', ...input }),
          defaultTo: list,
        },
        update: {
          run: async (id, input) => ({ id, name: input.name }),
          defaultTo: false,
        },
      },
    })

    expect(value.create().defaultTo?.({ id: '2', name: 'Two' })).toEqual(list)
    expect(value.update({ id: '1' }).defaultTo).toBeUndefined()
  })

  it('filters standard routes and row actions through access', () => {
    const value = resource({ allows: ({ operation }: { operation: string }) => operation === 'list' })
    const list = value.list()
    const record = { id: '1', name: 'One' }

    expect(list.createRoute).toBeUndefined()
    expect(list.detailRoute?.(record)).toBeUndefined()
    expect(list.updateRoute?.(record)).toBeUndefined()
    expect(list.canDelete).toBeUndefined()
  })
})
