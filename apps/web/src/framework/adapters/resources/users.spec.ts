import { describe, expect, it, vi } from 'vitest'
import { standardControls } from '@southneuhof/is-vue-framework'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })
const post = vi.fn(async () => ({}))

vi.mock('@/utils/services', () => ({ default: { post: (...args: unknown[]) => post(...(args as [])) } }))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    users: {
      list: { $get: vi.fn(async () => ok({ data: [{ id: 'u1', name: 'Admin', roleId: 'r1' }], total: 1, limit: 10 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: { id: 'u1', name: 'Admin', roleId: 'r1' } })) } },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: { id: 'u1' } })) } },
    },
    roles: {
      list: {
        $get: vi.fn(async () =>
          ok({
            data: [
              { id: 'r1', name: 'Admin' },
              { id: 'r2', name: 'Editor' },
            ],
            total: 2,
            limit: 100,
          })
        ),
      },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: {} })) } },
      create: { $post: vi.fn(async () => ok({ data: {} })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
      delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
    },
  },
}))

const { users, userFields, loadAssignableRoles, setUserRole } = await import('./users')

describe('users resource', () => {
  it('derives only the operations the API exposes', () => {
    expect(users.capabilities).toEqual({ list: true, detail: true, create: false, update: true, delete: false })
  })

  it('hides create and delete controls through inference, with no explicit false', () => {
    expect(standardControls({ resource: users, surface: 'list' })).toEqual([])
    expect(standardControls({ resource: users, surface: 'detail', id: 'u1' }).map((control) => control.key)).toEqual(['list', 'update'])
  })

  it('binds native props straight to the cores', () => {
    expect(users.table().namespace).toBe('users')
    expect(users.detail({ id: 'u1' }).id).toBe('u1')
    expect(Object.keys(users.form({ id: 'u1' }).fields as Record<string, unknown>)).toEqual(['name', 'email', 'roleId'])
  })

  it('reads the joined role name while the draft keeps the identity', () => {
    const read = userFields.roleId.read!

    expect(read({ roleId: 'r1', role: { id: 'r1', name: 'Admin' } } as never)).toBe('Admin')
    expect(read({ roleId: 'r1' } as never)).toBe('r1')
  })
})

describe('user role mapping', () => {
  it('composes assignable roles from the roles collection and the current assignment', async () => {
    const result = await loadAssignableRoles('u1')

    expect(result.data).toEqual([
      { id: 'r1', name: 'Admin', active: true },
      { id: 'r2', name: 'Editor', active: false },
    ])
  })

  it('assigns through the explicit mapping endpoint rather than a fake CRUD call', async () => {
    await setUserRole('u1', 'r2', true)

    expect(post).toHaveBeenCalledWith('mapping-user-roles/toggle', { user_id: 'u1', role_id: 'r2', active: true })
  })
})
