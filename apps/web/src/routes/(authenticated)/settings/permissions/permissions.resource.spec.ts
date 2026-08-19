import { describe, expect, it, vi } from 'vitest'
import { resolveFields } from '@southneuhof/is-vue-framework'

const { permissionResource } = await import('./permissions.resource')

describe('permission resource', () => {
  it('is a read-only catalog with realm and module fields', () => {
    expect(resolveFields({ fields: permissionResource.list().fields, surface: 'table' }).map((field) => field.key)).toEqual(['permissionCode', 'name', 'module', 'realm', 'description', 'active'])
    expect(resolveFields({ fields: permissionResource.detail({ id: 'permission-1' }).fields, surface: 'detail' }).map((field) => field.key)).toEqual([
      'permissionCode',
      'name',
      'module',
      'realm',
      'description',
      'active',
    ])
    expect((permissionResource as Record<string, unknown>).create).toBeUndefined()
    expect((permissionResource as Record<string, unknown>).update).toBeUndefined()
    expect((permissionResource as Record<string, unknown>).delete).toBeUndefined()
  })
})
