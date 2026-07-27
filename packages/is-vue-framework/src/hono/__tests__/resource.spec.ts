import { Hono } from 'hono'
import { hc } from 'hono/client'
import { validator } from 'hono/validator'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHonoResourceOperations } from '../resource'

const app = new Hono()
  .get('/roles/list', validator('query', (value) => value as { page?: string; status?: 'draft' | 'active'; blank?: string; absent?: string }), (context) => context.json({ data: [{ id: 'r1', name: 'Admin' }], page: 2, limit: 25, total: 1 }))
  .get('/roles/detail/:id', (context) => context.json({ data: { id: context.req.param('id'), name: 'Admin' } }))
  .post('/roles/create', validator('json', (value) => value as { name: string }), (context) => context.json({ data: { id: 'r2', ...context.req.valid('json') } }, 201))
  .patch('/roles/update/:id', validator('json', (value) => value as { name: string }), (context) => context.json({ data: { id: context.req.param('id') } }))
  .delete('/roles/delete/:id', (context) => context.json({ deleted: context.req.param('id') }))
  .get('/notices/list', (context) => context.json({ data: [{ id: 'n1', title: 'Notice' }] }))

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input))
  if (url.pathname === '/notices/create') return new Response(JSON.stringify({ error: 'missing' }), { status: 404 })
  if (url.pathname.endsWith('/list')) return new Response(JSON.stringify({ data: [{ id: 'r1', name: 'Admin' }], page: 2, limit: 25, total: 1 }))
  if (url.pathname.includes('/detail/')) return new Response(JSON.stringify({ data: { id: url.pathname.split('/').at(-1), name: 'Admin' } }))
  if (url.pathname.includes('/create')) return new Response(JSON.stringify({ data: { id: 'r2', ...JSON.parse(String(init?.body ?? '{}')) } }), { status: 201 })
  if (url.pathname.includes('/update/')) return new Response(JSON.stringify({ data: { id: url.pathname.split('/').at(-1) } }))
  return new Response(JSON.stringify({ deleted: url.pathname.split('/').at(-1) }))
})

afterEach(() => fetchMock.mockClear())

describe('createHonoResourceOperations', () => {
  it('keeps typed route keys exact while runtime wrappers are deliberately universal', async () => {
    const rpc = hc<typeof app>('https://api.test', { fetch: fetchMock })
    const roles = createHonoResourceOperations(rpc.roles)
    const notices = createHonoResourceOperations(rpc.notices)

    expect(Object.keys(roles)).toEqual(['list', 'detail', 'create', 'update', 'delete'])
    expect(Object.keys(notices)).toEqual(['list', 'detail', 'create', 'update', 'delete'])

    await expect((notices as any).create({ title: 'unsafe' })).rejects.toEqual({ error: 'missing' })
    expect(fetchMock).toHaveBeenLastCalledWith('https://api.test/notices/create', expect.objectContaining({ method: 'POST' }))
  })

  it('normalizes data, serializes query and identity, and preserves override-friendly wrappers', async () => {
    const rpc = hc<typeof app>('https://api.test', { fetch: fetchMock })
    const normalizeCollection = vi.fn((value) => ({ data: (value as any).data, meta: { page: 2, pageSize: 25, total: 1, totalPage: 1 } }))
    const normalizeRecord = vi.fn((value) => (value as any).data)
    const operations = createHonoResourceOperations(rpc.roles, { normalizeCollection, normalizeRecord })
    const overridden = { ...operations, list: vi.fn(operations.list) }

    await expect(overridden.list({ query: { page: 2, status: 'draft', blank: '', absent: null }, searchParameters: { page: 1, search: 'old' } })).resolves.toEqual({
      data: [{ id: 'r1', name: 'Admin' }],
      meta: { page: 2, pageSize: 25, total: 1, totalPage: 1 },
    })
    const listUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(Object.fromEntries(listUrl.searchParams)).toEqual({ page: '2', search: 'old', status: 'draft' })

    await expect(operations.detail({ id: { organizationId: 'org', roleId: 'r1' }, searchParameters: {} })).resolves.toEqual({ id: 'r1', name: 'Admin' })
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/roles/detail/org/r1')
    await expect(operations.create({ name: 'Editor' })).resolves.toEqual({ id: 'r2', name: 'Editor' })
    await expect(operations.update('r1', { name: 'Updated' })).resolves.toEqual({ id: 'r1' })
    await expect(operations.delete('r1')).resolves.toEqual({ deleted: 'r1' })
    expect(normalizeCollection).toHaveBeenCalledTimes(1)
    expect(normalizeRecord).toHaveBeenCalledTimes(3)
  })
})
