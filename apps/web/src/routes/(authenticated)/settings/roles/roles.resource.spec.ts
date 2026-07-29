import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
  resolveFields,
} from '@southneuhof/is-vue-framework'
import type { AccessAdapter } from '@southneuhof/is-vue-framework'
import { appFieldDefaults } from '@/configs/defaults'

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

beforeEach(() => {
  registerResourceRuntime({
    adapters: resolveFrameworkAdapters(),
    queryClient: createFrameworkQueryClient(),
    fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults),
  })
})
afterEach(() => resetResourceRuntimeForTests())

describe('roles resource', () => {
  it('declares exact standard capability permissions and targets', () => {
    expect(roles.capabilities.list).toMatchObject({ permission: 'roles.list', to: { name: 'settings-roles' } })
    expect(roles.capabilities.create).toMatchObject({ permission: 'roles.create', to: { name: 'settings-roles-create' } })
    const detailTarget = roles.capabilities.detail?.to
    expect(detailTarget?.params('1')).toEqual({ roleId: '1' })
    expect(roles.capabilities.delete).toMatchObject({ permission: 'roles.delete' })
    expect('to' in roles.capabilities.delete!).toBe(false)
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

  it('inherits createdAt from app defaults without a resource field declaration', () => {
    const { fields } = roles.table().table
    const resolved = resolveFields({
      fields,
      surface: 'table',
      defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields,
    })

    expect(Object.keys(fields as Record<string, unknown>)).toEqual(['name', 'createdAt'])
    expect(resolved.find((field) => field.key === 'createdAt')).toMatchObject({
      label: 'Dibuat',
      format: 'datetime',
      class: 'min-w-max whitespace-nowrap',
    })
  })

  it('validates create and update through the shared schemas', () => {
    expect(roles.form().schema?.validate({}).success).toBe(false)
    expect(roles.form().schema?.validate({ name: 'Editor' }).success).toBe(true)
    expect(roles.form({ id: '1' }).schema?.validate({}).success).toBe(true)
  })

  it('projects standard routes and delete capability separately', () => {
    const surface = roles.table()
    expect(surface.detailRoute?.({ id: '1', name: 'Admin' } as never)).toEqual({ name: 'settings-roles-detail', params: { roleId: '1' } })
    expect(surface.updateRoute?.({ id: '1', name: 'Admin' } as never)).toEqual({ name: 'settings-roles-edit', params: { roleId: '1' } })
    expect(surface.canDelete?.({ id: '1', name: 'Admin' } as never)).toBe(true)
  })

  /** Access reaches the factories through the runtime adapter, not per call. */
  it('hides denied row actions entirely', () => {
    const access: AccessAdapter = { allows: ({ operation }) => operation === 'list' }
    registerResourceRuntime({
      adapters: resolveFrameworkAdapters({ access }),
      queryClient: createFrameworkQueryClient(),
      fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults),
    })

    const surface = roles.table()
    expect(surface.detailRoute?.({ id: '1', name: 'Admin' } as never)).toBeUndefined()
    expect(surface.canDelete?.({ id: '1', name: 'Admin' } as never)).toBe(false)
  })
})

describe('role permissions resource', () => {
  it('owns child target while borrowing its parent update permission', () => {
    expect(rolePermissions.capabilities.list).toMatchObject({ permission: 'roles.update', to: { name: 'settings-roles-detail-permissions' } })
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
