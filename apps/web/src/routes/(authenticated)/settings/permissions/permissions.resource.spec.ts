import { describe, expect, it, vi } from 'vitest'

vi.mock('@/framework/rpc', () => ({ rpc: { permissions: {}, modules: {} } }))

const { permissionResource } = await import('./permissions.resource')

describe('permission resource', () => {
  it('is a read-only catalog with realm and module fields', () => {
    expect(permissionResource.capabilities).toEqual(expect.objectContaining({
      list: expect.objectContaining({ permission: 'view-permissions' }),
      detail: expect.objectContaining({ permission: 'view-permissions' }),
    }))
    expect(permissionResource.capabilities).not.toHaveProperty('create')
    expect(permissionResource.capabilities).not.toHaveProperty('update')
    expect(permissionResource.capabilities).not.toHaveProperty('delete')
    expect(Object.keys(permissionResource.table().table.fields as Record<string, unknown>)).toEqual(['permissionCode', 'name', 'module', 'realm', 'description', 'active'])
    expect(Object.keys(permissionResource.detail({ id: 'permission-1' }).detail.fields as Record<string, unknown>)).toEqual(['permissionCode', 'name', 'module', 'realm', 'description', 'active'])
  })
})
