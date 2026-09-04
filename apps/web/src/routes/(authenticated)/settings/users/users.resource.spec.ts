import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFrameworkQueryClient, registerResourceRuntime, resetResourceRuntimeForTests, resolveFields, resolveFrameworkAdapters, resolveFrameworkFieldDefaults } from '@southneuhof/loom'
import { appFieldDefaults } from '@/configs/defaults'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })
const create = vi.fn(async () => ok({ data: { id: 'u2', name: 'New user' } }))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    users: {
      list: { $get: vi.fn(async () => ok({ data: [], total: 0 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: {} })) } },
      create: { $post: create },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
    },
    roles: {
      list: { $get: vi.fn(async () => ok({ data: [], total: 0 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: {} })) } },
      create: { $post: vi.fn(async () => ok({ data: {} })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
      delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
    },
  },
}))

const { users } = await import('./users.resource')

beforeEach(() => {
  registerResourceRuntime({
    adapters: resolveFrameworkAdapters(),
    queryClient: createFrameworkQueryClient(),
    fieldDefaults: resolveFrameworkFieldDefaults(appFieldDefaults),
  })
  create.mockClear()
})

afterEach(() => resetResourceRuntimeForTests())

const createInput = {
  name: 'New user',
  email: 'new@example.test',
  password: 'password-123',
  roleIds: ['r1', 'r2'],
}

function fields(value: unknown, surface: 'form' | 'table' | 'detail') {
  return resolveFields({ fields: value as never, surface, defaultFields: resolveFrameworkFieldDefaults(appFieldDefaults).fields })
}

describe('users resource', () => {
  it('provides detail and update routes', () => {
    const record = { id: 'u1' }
    expect(users.list().detailRoute?.(record as never)).toEqual({ name: 'settings-users-detail', params: { userId: 'u1' } })
    expect(users.list().updateRoute?.(record as never)).toEqual({ name: 'settings-users-edit', params: { userId: 'u1' } })
  })

  it('requires unique roles and normalizes checkbox options to ids', () => {
    const schema = users.create().schema!
    expect(schema.validate({ ...createInput, roleIds: [] }).success).toBe(false)
    expect(schema.validate({ ...createInput, roleIds: [{ id: 'r1' }, { id: 'r2' }] })).toMatchObject({ success: true, data: { roleIds: ['r1', 'r2'] } })
    expect(schema.validate({ ...createInput, roleIds: [{ id: 'r1' }, { id: 'r1' }] }).success).toBe(false)
  })

  it('lists active roles and keeps the field create-only', () => {
    const createFields = fields(users.create().fields, 'form')
    expect(createFields.find((field) => field.key === 'roleIds')?.label).toBe('Roles')
    expect(createFields.find((field) => field.key === 'roleIds')?.props.searchParameters).toEqual({ active: true })

    const updateFields = fields(users.update({ id: 'u1' }).fields, 'form')
    expect(updateFields.map((field) => field.key)).not.toContain('roleIds')
  })

  it('sends one account request with all selected roles', async () => {
    await expect(users.create().run(createInput)).resolves.toEqual({ id: 'u2', name: 'New user' })
    expect(create).toHaveBeenCalledWith({ json: createInput })
  })
})
