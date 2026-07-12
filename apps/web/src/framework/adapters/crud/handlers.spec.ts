import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CRUDResource } from '@southneuhof/is-vue-framework/adapters/crud-operations'

const { route } = vi.hoisted(() => ({
  route: {
    list: { $get: vi.fn() },
    detail: { ':id': { $get: vi.fn() } },
    create: { $post: vi.fn() },
    update: { ':id': { $patch: vi.fn() } },
    delete: { ':id': { $delete: vi.fn() } },
  },
}))

vi.mock('@/framework/rpc', () => ({ rpc: { items: route } }))

import { list } from './list'
import { detail } from './detail'
import { create } from './create'
import { update } from './update'
import { deleteOperation } from './delete'

const resource = 'items' as CRUDResource<'items'>
const response = (payload: unknown, ok = true) => ({ ok, json: vi.fn(async () => payload) }) as unknown as Response

describe('RPC CRUD handlers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes list query and pagination', async () => {
    route.list.$get.mockResolvedValue(response({ data: [{ id: '1' }], total: 5, limit: 2 }))
    await expect(list({ resource, query: { page: 2, ignored: undefined } })).resolves.toEqual({ data: [{ id: '1' }], total: 5, totalPage: 3 })
    expect(route.list.$get).toHaveBeenCalledWith({ query: { page: '2' } })
  })

  it('routes detail, create, update, and delete', async () => {
    route.detail[':id'].$get.mockResolvedValue(response({ data: { id: '1' } }))
    route.create.$post.mockResolvedValue(response({ data: { id: '2' } }))
    route.update[':id'].$patch.mockResolvedValue(response({ data: { id: '1' } }))
    route.delete[':id'].$delete.mockResolvedValue(response({ ok: true }))

    await detail({ resource, id: ['parent', 'child'] })
    await create({ resource, input: { name: 'new' } })
    await update({ resource, id: '1', input: { name: 'updated' } })
    await deleteOperation({ resource, id: '1' })

    expect(route.detail[':id'].$get).toHaveBeenCalledWith({ param: { id: 'parent/child' } })
    expect(route.create.$post).toHaveBeenCalledWith({ json: { name: 'new' } })
    expect(route.update[':id'].$patch).toHaveBeenCalledWith({ param: { id: '1' }, json: { name: 'updated' } })
    expect(route.delete[':id'].$delete).toHaveBeenCalledWith({ param: { id: '1' } })
  })

  it('throws parsed RPC errors', async () => {
    route.list.$get.mockResolvedValue(response({ error: 'denied' }, false))
    await expect(list({ resource })).rejects.toEqual({ error: 'denied' })
  })
})
