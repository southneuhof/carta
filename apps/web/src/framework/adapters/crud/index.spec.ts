import { describe, expect, it, vi } from 'vitest'
import { defineRPCResources } from './index'

function response(payload: unknown, ok = true) {
  return { ok, json: vi.fn(async () => payload) } as unknown as Response
}

function rpcRoute() {
  return {
    list: { $get: vi.fn(async (_request: { query?: Record<string, unknown> }) => response({ data: [{ id: '1' }], total: 5, limit: 2 })) },
    detail: { ':id': { $get: vi.fn(async (_request: { param: { id: string } }) => response({ data: { id: '1' } })) } },
    create: { $post: vi.fn(async (_request: { json: Record<string, unknown> }) => response({ data: { id: '2' } })) },
    update: { ':id': { $patch: vi.fn(async (_request: { param: { id: string }; json: Record<string, unknown> }) => response({ data: { id: '1' } })) } },
    delete: { ':id': { $delete: vi.fn(async (_request: { param: { id: string } }) => response({ ok: true })) } },
  }
}

describe('defineRPCResources', () => {
  it('lazily creates and caches executable resources', () => {
    const route = rpcRoute()
    const resources = defineRPCResources({ items: route })
    expect(resources.items).toBe(resources.items)
  })

  it('normalizes calls and list pagination', async () => {
    const route = rpcRoute()
    const resource = defineRPCResources({ items: route }).items
    await expect(resource.list({ page: 2, ignored: undefined })).resolves.toEqual({ data: [{ id: '1' }], total: 5, totalPage: 3 })
    await resource.detail(['parent', 'child'])
    await resource.create({ name: 'new' })
    await resource.update('1', { name: 'updated' })
    await resource.delete('1')
    expect(route.list.$get).toHaveBeenCalledWith({ query: { page: '2' } })
    expect(route.detail[':id'].$get).toHaveBeenCalledWith({ param: { id: 'parent/child' } })
  })

  it('throws parsed RPC errors', async () => {
    const route = rpcRoute()
    route.list.$get.mockResolvedValue(response({ error: 'denied' }, false))
    await expect(defineRPCResources({ items: route }).items.list()).rejects.toEqual({ error: 'denied' })
  })
})
