import { describe, expect, it, vi } from 'vitest'
import { resolveCRUDOperations, type CRUDCompositeConfig, type CRUDOperations, type CRUDResource } from '../crudOperations'
import type { FrameworkCRUDRuntime } from '../../runtime'

type ItemResource = CRUDResource<'items', { id: string; name: string }, { name: string }, { name?: string }, { page?: number }, string>
const resource = 'items' as ItemResource

function operations(label: string): CRUDOperations<ItemResource> {
  return {
    list: vi.fn(async () => ({ data: [{ id: '1', name: label }] })),
    detail: vi.fn(async () => ({ id: '1', name: label })),
    create: vi.fn(async () => ({ id: '1', name: label })),
    update: vi.fn(async () => ({ id: '1', name: label })),
    delete: vi.fn(async () => undefined),
  }
}

describe('CRUD operations', () => {
  it('delegates resource identity to runtime handlers', async () => {
    const list = vi.fn(async () => ({ data: [{ id: '1', name: 'runtime' }] }))
    const runtime = { list, detail: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } as FrameworkCRUDRuntime
    const config = { name: 'items', title: 'Items', resource } satisfies CRUDCompositeConfig<ItemResource>
    await resolveCRUDOperations(config, {}, runtime).list({ page: 2 })
    expect(list).toHaveBeenCalledWith({ resource: 'items', query: { page: 2 } })
  })

  it('applies direct overrides after config overrides', async () => {
    const configList = vi.fn(async () => ({ data: [{ id: '1', name: 'config' }] }))
    const directList = vi.fn(async () => ({ data: [{ id: '1', name: 'direct' }] }))
    const config = { name: 'items', title: 'Items', resource, operations: { list: configList } } satisfies CRUDCompositeConfig<ItemResource>
    await expect(resolveCRUDOperations(config, { list: directList }).list()).resolves.toEqual({ data: [{ id: '1', name: 'direct' }] })
    expect(configList).not.toHaveBeenCalled()
  })

  it('supports complete resource-less operations', async () => {
    const config = { name: 'items', title: 'Items', operations: operations('local') } satisfies CRUDCompositeConfig<ItemResource>
    await expect(resolveCRUDOperations(config).detail('1')).resolves.toEqual({ id: '1', name: 'local' })
  })

  it('rejects incomplete resource-less operations from untyped JavaScript', () => {
    expect(() => resolveCRUDOperations({ name: 'items', title: 'Items', operations: { list: vi.fn() } } as never)).toThrow('Resource-less CRUD config requires complete operations')
  })
})
