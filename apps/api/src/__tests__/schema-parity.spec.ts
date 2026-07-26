/**
 * Drift gate for the browser-safe schema manifest.
 *
 * The API entity modules own the authoritative Zod schemas, but they cannot be
 * imported into the browser. `@southneuhof/contracts` therefore re-declares the
 * same operation schemas, and this test — which can import both sides — proves
 * they stay equivalent. A schema change on either side fails here.
 */
import { describe, expect, it } from 'vitest'
import { roleSchemas, userSchemas } from '@southneuhof/contracts'
import { role } from '../routes/roles/roles.entity'
import { user } from '../routes/users/users.entity'

/**
 * Compared structurally: `drizzle-zod` emits Zod 4 objects on the server while
 * the manifest declares Zod 3 classic objects. The two are never mixed at
 * runtime, so parity is asserted on shape and parse results, not on types.
 *
 * Plan 020 unified sprindle and api on the `zod/v4` import dialect and left
 * `@southneuhof/contracts` on Zod 3 classic, so this workaround stays.
 */
type SchemaLike = {
  shape: Record<string, { isOptional: () => boolean }>
  safeParse: (input: unknown) => { success: boolean }
}

const asSchema = (schema: unknown) => schema as unknown as SchemaLike

function describeShape(schema: unknown) {
  return Object.entries(asSchema(schema).shape)
    .map(([key, value]) => `${key}${value.isOptional() ? '?' : ''}`)
    .sort()
}

const cases = [
  { resource: 'roles', operation: 'create', server: role.schemas.create, client: roleSchemas.create },
  { resource: 'roles', operation: 'update', server: role.schemas.update, client: roleSchemas.update },
  { resource: 'users', operation: 'create', server: user.schemas.create, client: userSchemas.create },
  { resource: 'users', operation: 'update', server: user.schemas.update, client: userSchemas.update },
] as const

describe('server and client schema parity', () => {
  for (const { resource, operation, server, client } of cases) {
    it(`keeps ${resource}.${operation} keys and requiredness in step`, () => {
      expect(describeShape(client)).toEqual(describeShape(server))
    })
  }

  it('accepts and rejects the same representative payloads', () => {
    const validUser = { name: 'Admin', email: 'admin@example.test', roleId: 'role-1' }

    expect(asSchema(user.schemas.create).safeParse(validUser).success).toBe(
      userSchemas.create.safeParse(validUser).success,
    )
    expect(asSchema(user.schemas.create).safeParse({ name: 'Admin' }).success).toBe(
      userSchemas.create.safeParse({ name: 'Admin' }).success,
    )
    expect(asSchema(role.schemas.create).safeParse({}).success).toBe(roleSchemas.create.safeParse({}).success)
  })
})
