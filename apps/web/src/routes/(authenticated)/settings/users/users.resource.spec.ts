import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBehaviorRuntime, createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/is-vue-framework'
import { reactive } from 'vue'
import { appFieldDefaults } from '@/configs/defaults'

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
      create: { $post: vi.fn(async () => ok({ data: { id: 'u2', name: 'New user' } })) },
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

beforeEach(() => {
  registerResourceRuntime({
    adapters: resolveFrameworkAdapters(),
    queryClient: createFrameworkQueryClient(),
    fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults),
  })
})

afterEach(() => resetResourceRuntimeForTests())

describe('users resource', () => {
  it('provides only row actions resource can derive', () => {
    const record = {
      id: 'u1',
      name: 'Admin',
      email: 'a@b.c',
      username: 'admin',
      emailVerified: false,
      image: null,
      imgPhotoUser: null,
      statusCode: 'active',
      employeeId: null,
      failedAttemptCount: 0,
      lastLoginAt: null,
      passwordChangedAt: null,
      createdAt: '',
      updatedAt: '',
    }
    expect(users.table().detailRoute?.(record)).toEqual({ name: 'settings-users-detail', params: { userId: 'u1' } })
    expect(users.table().updateRoute?.(record)).toEqual({ name: 'settings-users-edit', params: { userId: 'u1' } })
  })

  it('binds native props straight to the cores', () => {
    expect(users.table().table.namespace).toBe('users')
    expect(users.detail({ id: 'u1' }).detail.id).toBe('u1')
    expect(Object.keys(users.form({ id: 'u1', context: { operation: 'update' } }).fields as Record<string, unknown>)).toEqual(['name', 'username', 'email', 'password', 'imgPhotoUser'])
  })

  it('links a row to its detail screen through the identity extractor', () => {
    expect(
      users.detailRoute!({
        id: 'u1',
        name: 'Admin',
        email: 'a@b.c',
        username: 'admin',
        emailVerified: false,
        image: null,
        imgPhotoUser: null,
        statusCode: 'active',
        employeeId: null,
        failedAttemptCount: 0,
        lastLoginAt: null,
        passwordChangedAt: null,
        createdAt: '',
        updatedAt: '',
      })
    ).toEqual({
      name: 'settings-users-detail',
      params: { userId: 'u1' },
    })
  })

  it('declares standard targets and permissions in its capabilities', () => {
    expect(users.capabilities.list).toMatchObject({ permission: 'view-users', to: { name: 'settings-users' } })
    expect(users.capabilities.create).toMatchObject({ permission: 'create-users', to: { name: 'settings-users-create' } })
    expect(users.capabilities.update).toMatchObject({ permission: 'update-users', to: { name: 'settings-users-edit' } })
  })

  it('normalizes credential creation through the custom endpoint', async () => {
    await expect(users.capabilities.create!.handler({ name: 'New user', username: 'new-user', email: 'new@example.test', password: 'password-123' })).resolves.toEqual({ id: 'u2', name: 'New user' })
  })

  it('hides create-only fields from the update form', () => {
    const surface = users.form({ id: 'u1', context: { operation: 'update' } })
    const resolved = resolveFields({ fields: surface.fields, surface: 'form', defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
    const runtime = createBehaviorRuntime({ fields: resolved as never, draft: reactive({}) as never, context: { operation: 'update' } })

    expect(runtime.visibleKeys.value).toEqual(['name', 'username'])
  })

  it('carries no single-role field, because roles are a many-to-many assignment', () => {
    expect(users.table().table.fields).not.toHaveProperty('roleId')
    expect(Object.keys(users.form({ id: 'u1', context: { operation: 'update' } }).fields as Record<string, unknown>)).not.toContain('roleId')
  })
})

describe('user role mapping', () => {
  it('owns its child collection target and borrowed parent permission', () => {
    expect(userRoles.capabilities.list).toMatchObject({ permission: 'manage-user-roles', to: { name: 'settings-users-detail-roles' } })
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
