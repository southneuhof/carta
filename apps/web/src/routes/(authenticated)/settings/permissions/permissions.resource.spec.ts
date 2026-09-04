import { describe, expect, it } from 'vitest'
import { resolveFields } from '@southneuhof/loom'

const { permissionResource } = await import('./permissions.resource')

describe('permission resource', () => {
  it('is a read-only catalog without module and target fields', () => {
    const listFields = resolveFields({ fields: permissionResource.list().fields, surface: 'table' })
    expect(listFields.map((field) => field.key)).toEqual(['permissionCode', 'name', 'description', 'active'])
    expect(resolveFields({ fields: permissionResource.detail({ id: 'permission-1' }).fields, surface: 'detail' }).map((field) => field.key)).toEqual([
      'permissionCode',
      'name',
      'description',
      'active',
    ])
    expect((permissionResource as Record<string, unknown>).create).toBeUndefined()
    expect((permissionResource as Record<string, unknown>).update).toBeUndefined()
    expect((permissionResource as Record<string, unknown>).delete).toBeUndefined()
  })
})
