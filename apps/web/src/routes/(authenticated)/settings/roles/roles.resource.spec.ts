import { describe, expect, it, vi } from 'vitest'

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

const { roles, roleFields } = await import('./roles.resource')

describe('role resource', () => {
  it('declares the role catalog fields and standard capabilities', () => {
    expect(Object.keys(roleFields)).toEqual(['roleCode', 'name', 'description', 'realm', 'active', 'createdAt'])
    expect(Object.keys(roles.table().table.fields as Record<string, unknown>)).toEqual(['roleCode', 'name', 'realm', 'active'])
    expect(Object.keys(roles.detail({ id: 'role-1' }).detail.fields as Record<string, unknown>)).toEqual(['roleCode', 'name', 'description', 'realm', 'active', 'createdAt'])
    expect(roles.form().fields).toEqual(expect.objectContaining({ realm: expect.any(Object) }))
    expect(roles.capabilities.list).toMatchObject({ permission: 'view-roles', to: { name: 'settings-roles' } })
    expect(roles.capabilities.create).toMatchObject({ permission: 'manage-roles', to: { name: 'settings-roles-create' } })
    expect(roles.capabilities.update).toMatchObject({ permission: 'manage-roles', to: { name: 'settings-roles-edit' } })
    expect(roles.capabilities.delete).toMatchObject({ permission: 'manage-roles' })
  })

  it('requires a realm on create and keeps it immutable on update', () => {
    expect(roles.form().schema?.validate({ roleCode: 'editor', name: 'Editor', realm: 'system' }).success).toBe(true)
    expect(roles.form().schema?.validate({ roleCode: 'editor', name: 'Editor' }).success).toBe(false)
    expect(roles.form({ id: 'role-1' }).schema?.validate({ realm: 'system', name: 'Editor' }).success).toBe(true)

    const disabled = roleFields.realm.form?.behavior?.disabled
    const draft = { roleCode: 'editor', name: 'Editor', realm: 'system' as const }
    expect(disabled?.({ draft, value: 'system', context: { operation: 'update' } })).toBe(true)
    expect(disabled?.({ draft, value: 'system', context: { operation: 'create' } })).toBe(false)
  })
})
