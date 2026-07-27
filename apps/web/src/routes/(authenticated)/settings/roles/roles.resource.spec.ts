import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFrameworkAdapters,
} from '@southneuhof/is-vue-framework'
import type { AccessAdapter } from '@southneuhof/is-vue-framework'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

vi.mock('@/framework/rpc', () => ({
  rpc: {
    roles: {
      list: { $get: vi.fn(async () => ok({ data: [{ id: '1', name: 'Admin' }], total: 1, limit: 10 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: { id: '1', name: 'Admin' } })) } },
      create: { $post: vi.fn(async () => ok({ data: { id: '2' } })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: { id: '1' } })) } },
      delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
      ':roleId': { permissions: { $get: vi.fn(async () => ok({ data: [], total: 0 })) } },
    },
  },
}))

const { roles } = await import('./roles.resource')
const { rolePermissions } = await import('./[roleId]/detail/permissions/role-permissions.resource')

afterEach(() => resetResourceRuntimeForTests())

describe('roles resource', () => {
  it('declares exact standard action permissions and targets', () => {
    expect(roles.actions.list).toMatchObject({ permission: 'roles.list', routeName: 'settings-roles' })
    expect(roles.actions.create).toMatchObject({ permission: 'roles.create', routeName: 'settings-roles-create' })
    const detailTarget = roles.actions.detail?.to
    expect(typeof detailTarget).toBe('function')
    expect((detailTarget as (id: string) => unknown)('1')).toEqual({ name: 'settings-roles-detail', params: { roleId: '1' } })
    expect(roles.actions.delete).toMatchObject({ permission: 'roles.delete' })
    expect(roles.actions.delete?.to).toBeUndefined()
  })
  it('shows controls from declared actions', () => {
    expect(roles.table().controls.map((control) => control.key)).toEqual(['create'])
  })

  it('produces core props that bind directly, with no adapter shape', () => {
    const { table } = roles.table()
    const { detail } = roles.detail({ id: '1' })
    const create = roles.form()
    const update = roles.form({ id: '1' })

    expect(table.namespace).toBe('roles')
    expect(typeof table.load).toBe('function')
    expect(detail.id).toBe('1')
    expect(create.load).toBeUndefined()
    expect(typeof update.load).toBe('function')
    expect(Object.keys(create.fields as Record<string, unknown>)).toEqual(['name'])
  })

  it('validates create and update through the shared schemas', () => {
    expect(roles.form().schema?.validate({}).success).toBe(false)
    expect(roles.form().schema?.validate({ name: 'Editor' }).success).toBe(true)
    expect(roles.form({ id: '1' }).schema?.validate({}).success).toBe(true)
  })

  it('infers standard controls from behavior and routes', () => {
    expect(roles.table().controls.map((control) => control.key)).toEqual(['create'])
    expect(roles.detail({ id: '1', onDelete: () => undefined }).controls.map((control) => control.key)).toEqual([
      'list',
      'update',
      'delete',
    ])
  })

  /** Access reaches the factories through the runtime adapter, not per call. */
  it('hides denied controls entirely', () => {
    const access: AccessAdapter = { allows: ({ operation }) => operation === 'list' }
    registerResourceRuntime({
      adapters: resolveFrameworkAdapters({ access }),
      queryClient: createFrameworkQueryClient(),
    })

    expect(roles.table().controls).toEqual([])
    expect(roles.detail({ id: '1', onDelete: () => undefined }).controls.map((control) => control.key)).toEqual(['list'])
  })
})

describe('role permissions resource', () => {
  it('owns child target while borrowing its parent update permission', () => {
    expect(rolePermissions.actions.list).toMatchObject({ permission: 'roles.update', routeName: 'settings-roles-detail-permissions' })
  })
  it('is scoped by an ordinary searchParameters entry, with no parent vocabulary', () => {
    const props = rolePermissions.table({ searchParameters: { role_id: '1' } }).table

    expect(props.searchParameters).toEqual({ role_id: '1' })
    expect(Object.keys(props)).not.toContain('parent')
  })

  it('returns an empty collection when no role is in scope', async () => {
    expect(await rolePermissions.table().table.load!({ query: {}, searchParameters: {} })).toEqual({ data: [] })
  })
})
