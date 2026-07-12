import { describe, expect, it, vi } from 'vitest'
import { resolveCRUDOperations, type CRUDCompositeConfig, type CRUDOperations, type CRUDResource } from '../crudOperations'

function operations(label: string): CRUDOperations {
  return {
    list: vi.fn(async () => ({ data: [{ label }] })),
    detail: vi.fn(async () => ({ label })),
    create: vi.fn(async () => ({ label })),
    update: vi.fn(async () => ({ label })),
    delete: vi.fn(async () => ({ label })),
  }
}

describe('CRUD operations', () => {
  it('uses resource operations directly', async () => {
    const resource = operations('resource')
    const config = { name: 'items', title: 'Items', resource } satisfies CRUDCompositeConfig<typeof resource>
    const resolved = resolveCRUDOperations(config)
    await resolved.list({ page: 2 })
    await resolved.update('1', { name: 'updated' })
    expect(resource.list).toHaveBeenCalledWith({ page: 2 })
    expect(resource.update).toHaveBeenCalledWith('1', { name: 'updated' })
  })

  it('applies direct overrides after config overrides', async () => {
    const resource = operations('resource')
    const configList = vi.fn(async () => ({ data: [{ label: 'config' }] }))
    const directList = vi.fn(async () => ({ data: [{ label: 'direct' }] }))
    const config = { name: 'items', title: 'Items', resource, operations: { list: configList } } satisfies CRUDCompositeConfig<typeof resource>
    await expect(resolveCRUDOperations(config, { list: directList }).list()).resolves.toEqual({ data: [{ label: 'direct' }] })
    expect(configList).not.toHaveBeenCalled()
  })

  it('supports complete resource-less operations', async () => {
    const config = { name: 'items', title: 'Items', operations: operations('local') } satisfies CRUDCompositeConfig<CRUDResource>
    await expect(resolveCRUDOperations(config).detail('1')).resolves.toEqual({ label: 'local' })
  })

  it('reports incomplete operations passed from untyped JavaScript', () => {
    expect(() => resolveCRUDOperations({ name: 'items', title: 'Items', operations: { list: vi.fn() } } as never)).toThrow('Missing CRUD operation: detail')
  })
})
