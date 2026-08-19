import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appFieldDefaults } from '@/configs/defaults'
import {
  createFrameworkQueryClient,
  registerResourceRuntime,
  resetResourceRuntimeForTests,
  resolveFields,
  resolveFrameworkAdapters,
  resolveFrameworkFieldDefaults,
} from '@southneuhof/is-vue-framework'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

vi.mock('@/framework/rpc', () => ({
  rpc: {
    roles: {
      list: { $get: vi.fn(async () => ok({ data: [], total: 0 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: {} })) } },
      create: { $post: vi.fn(async () => ok({ data: {} })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
      delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
    },
  },
}))

const { roles } = await import('./roles.resource')

beforeEach(() => registerResourceRuntime({ adapters: resolveFrameworkAdapters(), queryClient: createFrameworkQueryClient(), fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults) }))
afterEach(() => resetResourceRuntimeForTests())

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('role resource', () => {
  it('declares complete fields and standard action routes', () => {
    expect(fields(roles.list().fields, 'table').map((field) => field.key)).toEqual(['roleCode', 'name', 'realm', 'active'])
    expect(fields(roles.detail({ id: 'role-1' }).fields, 'detail').map((field) => field.key)).toEqual(['roleCode', 'name', 'description', 'realm', 'active', 'createdAt'])
    expect(fields(roles.create().fields, 'form').map((field) => field.key)).toEqual(['roleCode', 'name', 'description', 'realm', 'active'])
    expect(roles.list().createRoute).toEqual({ name: 'settings-roles-create' })
    expect(roles.list().detailRoute?.({ id: 'role-1' } as never)).toEqual({ name: 'settings-roles-detail', params: { roleId: 'role-1' } })
    expect(roles.list().updateRoute?.({ id: 'role-1' } as never)).toEqual({ name: 'settings-roles-edit', params: { roleId: 'role-1' } })
    expect(roles.list().canDelete).toEqual(expect.any(Function))
  })

  it('requires a realm on create and keeps it immutable on update', () => {
    expect(roles.create().schema?.validate({ roleCode: 'editor', name: 'Editor', realm: 'system' }).success).toBe(true)
    expect(roles.create().schema?.validate({ roleCode: 'editor', name: 'Editor' }).success).toBe(false)
    expect(roles.update({ id: 'role-1' }).schema?.validate({ realm: 'system', name: 'Editor' }).success).toBe(true)

    const createRealm = fields(roles.create().fields, 'form').find((field) => field.key === 'realm')
    const updateRealm = fields(roles.update({ id: 'role-1' }).fields, 'form').find((field) => field.key === 'realm')
    expect(createRealm?.behavior?.disabled).toBeUndefined()
    expect(updateRealm?.behavior?.disabled?.({ draft: {}, value: 'system', context: {} } as never)).toBe(true)
  })
})
