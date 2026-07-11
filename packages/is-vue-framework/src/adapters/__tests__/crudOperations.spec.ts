import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  configureCRUDOperationAdapter,
  defineCRUDCompositeConfig,
  resetCRUDOperationAdapterForTests,
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

afterEach(resetCRUDOperationAdapterForTests)

describe('CRUD operation adapter', () => {
  it('keeps resources opaque and resolves centralized defaults', async () => {
    const resource = { transportSpecific: Symbol('resource') }
    configureCRUDOperationAdapter({ createOperations: (received: typeof resource) => {
      expect(received).toBe(resource)
      return operations('default')
    } })

    const config = defineCRUDCompositeConfig({ name: 'items', title: 'Items', resource })
    await expect(resolveCRUDOperations(config).list()).resolves.toEqual({ data: [{ label: 'default' }] })
  })

  it('applies direct overrides after config overrides', async () => {
    configureCRUDOperationAdapter({ createOperations: () => operations('default') })
    const configList = vi.fn(async () => ({ data: [{ label: 'config' }] }))
    const directList = vi.fn(async () => ({ data: [{ label: 'direct' }] }))
    const config = defineCRUDCompositeConfig({ name: 'items', title: 'Items', resource: {}, operations: { list: configList } })

    await expect(resolveCRUDOperations(config, { list: directList }).list()).resolves.toEqual({ data: [{ label: 'direct' }] })
    expect(configList).not.toHaveBeenCalled()
  })

  it('supports a complete per-config operation bundle without an adapter', async () => {
    const config = defineCRUDCompositeConfig({ name: 'items', title: 'Items', resource: null, operations: operations('local') })
    await expect(resolveCRUDOperations(config).detail('1')).resolves.toEqual({ label: 'local' })
  })
})
