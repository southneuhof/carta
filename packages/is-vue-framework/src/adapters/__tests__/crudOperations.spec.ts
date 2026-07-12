import { describe, expect, it, vi } from 'vitest'
import {
  defineCRUDCompositeConfig,
  resolveCRUDOperations,
  type CRUDOperations,
} from '../crudOperations'

function operations(label: string): CRUDOperations {
  return {
    list: vi.fn(async () => ({ data: [{ label }] })),
    detail: vi.fn(async () => ({ label })),
    create: vi.fn(async () => ({ label })),
    update: vi.fn(async () => ({ label })),
    delete: vi.fn(async () => ({ label })),
  }
}

describe('CRUD behaviors', () => {
  it('keeps resources opaque and binds every operation argument', async () => {
    const resource = { transportSpecific: Symbol('resource') }
    const crud = {
      list: vi.fn(async () => ({ data: [{ label: 'list' }] })),
      detail: vi.fn(async () => ({ label: 'detail' })),
      create: vi.fn(async () => ({ label: 'create' })),
      update: vi.fn(async () => ({ label: 'update' })),
      delete: vi.fn(async () => ({ label: 'delete' })),
    }
    const config = defineCRUDCompositeConfig({ name: 'items', title: 'Items', resource })
    const resolved = resolveCRUDOperations(config, {}, crud)
    await resolved.list({ page: 2 })
    await resolved.detail('1', { active: true })
    await resolved.create({ name: 'new' })
    await resolved.update('1', { name: 'updated' })
    await resolved.delete('1')

    expect(crud.list).toHaveBeenCalledWith({ resource, query: { page: 2 } })
    expect(crud.detail).toHaveBeenCalledWith({ resource, id: '1', query: { active: true } })
    expect(crud.create).toHaveBeenCalledWith({ resource, input: { name: 'new' } })
    expect(crud.update).toHaveBeenCalledWith({ resource, id: '1', input: { name: 'updated' } })
    expect(crud.delete).toHaveBeenCalledWith({ resource, id: '1' })
  })

  it('applies direct overrides after config overrides', async () => {
    const crud = {
      list: async () => ({ data: [{ label: 'default' }] }),
      detail: async () => ({ label: 'default' }),
      create: async () => ({ label: 'default' }),
      update: async () => ({ label: 'default' }),
      delete: async () => ({ label: 'default' }),
    }
    const configList = vi.fn(async () => ({ data: [{ label: 'config' }] }))
    const directList = vi.fn(async () => ({ data: [{ label: 'direct' }] }))
    const config = defineCRUDCompositeConfig({ name: 'items', title: 'Items', resource: {}, operations: { list: configList } })

    await expect(resolveCRUDOperations(config, { list: directList }, crud).list()).resolves.toEqual({ data: [{ label: 'direct' }] })
    expect(configList).not.toHaveBeenCalled()
  })

  it('supports a complete per-config operation bundle without registered behaviors', async () => {
    const config = defineCRUDCompositeConfig({ name: 'items', title: 'Items', resource: null, operations: operations('local') })
    await expect(resolveCRUDOperations(config).detail('1')).resolves.toEqual({ label: 'local' })
  })

  it('reports missing operations through behavior diagnostics', async () => {
    const config = defineCRUDCompositeConfig({ name: 'items', title: 'Items', resource: {} })
    await expect(resolveCRUDOperations(config).list()).rejects.toThrow('Missing behavior: crud.list')
  })
})
