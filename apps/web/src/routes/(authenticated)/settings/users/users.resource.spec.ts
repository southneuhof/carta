import { describe, expect, it, vi } from 'vitest'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

const assignRole = vi.fn(async () => ok({ data: { id: 'r2', assigned: true } }))
const revokeRole = vi.fn(async () => ok({ data: { id: 'r2', assigned: false } }))
const listUserRoles = vi.fn(async () =>
  ok({
    data: [
      { id: 'r1', name: 'Admin', assigned: true },
      { id: 'r2', name: 'Editor', assigned: false },
    ],
    total: 2,
  })
)

vi.mock('@/framework/rpc', () => ({
  rpc: {
    users: {
      list: { $get: vi.fn(async () => ok({ data: [{ id: 'u1', name: 'Admin' }], total: 1, limit: 10 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: { id: 'u1', name: 'Admin' } })) } },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: { id: 'u1' } })) } },
      ':userId': {
        roles: Object.assign({ $get: listUserRoles }, { ':roleId': { $put: assignRole, $delete: revokeRole } }),
      },
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

const { users } = await import('./users.resource')
const { userRoles } = await import('./[userId]/detail/roles/user-roles.resource')
const { loadUserRoles, setUserRole } = await import('./[userId]/detail/roles/user-roles.operations')

describe('users resource', () => {
  it('provides only row actions resource can derive', () => {
    expect(users.table().rowControls?.({ id: 'u1', name: 'Admin', email: 'a@b.c', emailVerified: false, image: null, createdAt: '', updatedAt: '' }).map((action) => action.key)).toEqual(['detail', 'update'])
  })

  it('binds native props straight to the cores', () => {
    expect(users.table().table.namespace).toBe('users')
    expect(users.detail({ id: 'u1' }).detail.id).toBe('u1')
    expect(Object.keys(users.form({ id: 'u1' }).fields as Record<string, unknown>)).toEqual(['name'])
  })

  it('links a row to its detail screen through the identity extractor', () => {
    expect(users.rowLink!({ id: 'u1', name: 'Admin', email: 'a@b.c', emailVerified: false, image: null, createdAt: '', updatedAt: '' })).toEqual({
      name: 'settings-users-detail',
      params: { userId: 'u1' },
    })
  })

  it('declares standard targets and permissions in its actions', () => {
    expect(users.actions.list).toMatchObject({ permission: 'users.list', routeName: 'settings-users' })
    expect(users.actions.update).toMatchObject({ permission: 'users.update', routeName: 'settings-users-edit' })
  })

  it('carries no single-role field, because roles are a many-to-many assignment', () => {
    expect(users.table().table.fields).not.toHaveProperty('roleId')
    expect(Object.keys(users.form({ id: 'u1' }).fields as Record<string, unknown>)).not.toContain('roleId')
  })
})

describe('user role mapping', () => {
  it('owns its child collection target and borrowed parent permission', () => {
    expect(userRoles.actions.list).toMatchObject({ permission: 'users.update', routeName: 'settings-users-detail-roles' })
  })
  it('marks every role the user actively holds, not one single assignment', async () => {
    const result = await loadUserRoles('u1')

    expect(listUserRoles).toHaveBeenCalledWith({ param: { userId: 'u1' } })
    expect(result.data).toEqual([
      { id: 'r1', name: 'Admin', assigned: true },
      { id: 'r2', name: 'Editor', assigned: false },
    ])
  })

  // The endpoint this replaced never existed on the API. The previous version of
  // this test mocked the HTTP helper, so it asserted the call shape and not that
  // anything answered it — assert the real RPC route instead.
  it('assigns through the real user-roles RPC route', async () => {
    await setUserRole('u1', 'r2', true)

    expect(assignRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r2' } })
    expect(revokeRole).not.toHaveBeenCalled()
  })

  it('revokes through the same route with DELETE', async () => {
    await setUserRole('u1', 'r2', false)

    expect(revokeRole).toHaveBeenCalledWith({ param: { userId: 'u1', roleId: 'r2' } })
  })
})
