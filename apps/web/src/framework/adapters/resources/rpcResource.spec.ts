import { describe, expect, it, vi } from 'vitest'
import { defineResource } from '@southneuhof/is-vue-framework'
import { createRpcOperations } from './rpcResource'
import type { RpcCRUDRoute } from './rpcRoute'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload } as unknown as Response)

function fullRoute() {
  return {
    list: { $get: vi.fn(async () => ok({ data: [{ id: '1', name: 'Admin' }], total: 1, limit: 10 })) },
    detail: { ':id': { $get: vi.fn(async () => ok({ data: { id: '1', name: 'Admin' } })) } },
    create: { $post: vi.fn(async () => ok({ data: { id: '2' } })) },
    update: { ':id': { $patch: vi.fn(async () => ok({ data: { id: '1' } })) } },
    delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
  }
}

describe('RPC resource operations', () => {
  it('derives every operation the route exposes', async () => {
    const route = fullRoute()
    const operations = createRpcOperations(route as unknown as RpcCRUDRoute)

    const collection = await operations.list!({ query: { page: 2 }, searchParameters: { role_id: '1' } })
    expect(route.list.$get).toHaveBeenCalledWith({ query: { role_id: '1', page: '2' } })
    expect(collection).toEqual({ data: [{ id: '1', name: 'Admin' }], meta: { total: 1, page: undefined, pageSize: 10, totalPage: 1 } })

    await operations.detail!({ id: '1', searchParameters: {} })
    expect(route.detail[':id'].$get).toHaveBeenCalledWith({ param: { id: '1' }, query: {} })

    await operations.create!({ name: 'Editor' })
    expect(route.create.$post).toHaveBeenCalledWith({ json: { name: 'Editor' } })

    await operations.update!('1', { name: 'Diubah' })
    expect(route.update[':id'].$patch).toHaveBeenCalledWith({ param: { id: '1' }, json: { name: 'Diubah' } })

    await operations.delete!('1')
    expect(route.delete[':id'].$delete).toHaveBeenCalledWith({ param: { id: '1' } })
  })

  it('produces read-only operations for a read-only route', () => {
    const route = { list: fullRoute().list, detail: fullRoute().detail }
    const resource = defineResource({ key: 'roles', fields: {}, operations: createRpcOperations(route as unknown as RpcCRUDRoute) })

    expect(resource.capabilities).toEqual({ list: true, detail: true, create: false, update: false, delete: false })
  })

  it('produces update-only operations for a route without create or delete', () => {
    const { list, detail, update } = fullRoute()
    const resource = defineResource({
      key: 'users',
      fields: {},
      operations: createRpcOperations({ list, detail, update } as unknown as RpcCRUDRoute),
    })

    expect(resource.capabilities).toEqual({ list: true, detail: true, create: false, update: true, delete: false })
  })

  it('supports local resources with no RPC route at all', async () => {
    const rows = [{ id: '1', name: 'Offline' }]
    const resource = defineResource({ key: 'offline-roles', fields: {}, operations: { list: () => ({ data: rows }) } })

    expect(resource.capabilities.list).toBe(true)
    expect(await resource.table().table.load!({ query: {}, searchParameters: {} })).toEqual({ data: rows })
  })

  it('lets an explicit override replace a derived operation', async () => {
    const route = fullRoute()
    const list = vi.fn(async () => ({ data: [] }))
    const resource = defineResource({
      key: 'roles',
      fields: {},
      operations: { ...createRpcOperations(route as unknown as RpcCRUDRoute), list },
    })

    await resource.table().table.load!({ query: {}, searchParameters: {} })

    expect(list).toHaveBeenCalled()
    expect(route.list.$get).not.toHaveBeenCalled()
  })

  it('throws the parsed payload when the backend rejects the call', async () => {
    const route = {
      list: { $get: async () => ({ ok: false, json: async () => ({ message: 'Ditolak' }) } as unknown as Response) },
    }
    const operations = createRpcOperations(route as unknown as RpcCRUDRoute)

    await expect(operations.list!({ query: {}, searchParameters: {} })).rejects.toEqual({ message: 'Ditolak' })
  })
})
