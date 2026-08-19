import { Hono } from 'hono'
import { hc } from 'hono/client'
import { validator } from 'hono/validator'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHonoResourceActions } from './actions'

const app = new Hono()
  .get(
    '/rows/list',
    validator('query', (value) => value as { page?: string; search?: string; blank?: string }),
    (context) => context.json({ data: [{ id: '1', name: 'One' }], page: 1, limit: 10, total: 1 })
  )
  .get('/rows/detail/:id', (context) => context.json({ data: { id: context.req.param('id'), name: 'One' } }))
  .post(
    '/rows/create',
    validator('json', (value) => value as { name: string }),
    (context) => context.json({ data: { id: '2', name: 'Two' } }, 201)
  )
  .patch(
    '/rows/update/:id',
    validator('json', (value) => value as { name: string }),
    (context) => context.json({ data: { id: context.req.param('id'), name: 'Updated' } })
  )
  .delete('/rows/delete/:id', (context) => context.json({ deleted: context.req.param('id') }))

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => app.fetch(new Request(String(input), init)))

afterEach(() => fetchMock.mockClear())

describe('createHonoResourceActions', () => {
  it('normalizes standard actions and serializes query and identity', async () => {
    const rpc = hc<typeof app>('https://api.test', { fetch: fetchMock })
    const actions = createHonoResourceActions(rpc.rows)

    await expect(actions.list({ query: { page: 2, blank: '' }, searchParameters: { search: 'one' } })).resolves.toEqual({
      data: [{ id: '1', name: 'One' }],
      meta: { page: 1, pageSize: 10, total: 1, totalPage: 1 },
    })
    await expect(actions.detail({ id: '1', searchParameters: {} })).resolves.toEqual({ id: '1', name: 'One' })
    await expect(actions.create({ name: 'Two' })).resolves.toEqual({ id: '2', name: 'Two' })
    await expect(actions.update('1', { name: 'Updated' })).resolves.toEqual({ id: '1', name: 'Updated' })
    await expect(actions.delete('1')).resolves.toEqual({ deleted: '1' })
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('search=one')
  })

  it('throws the failed payload once', async () => {
    const rpc = hc<typeof app>('https://api.test', { fetch: async () => new Response(JSON.stringify({ error: 'bad' }), { status: 400 }) })
    const actions = createHonoResourceActions(rpc.rows)
    await expect(actions.list({ query: {}, searchParameters: {} })).rejects.toEqual({ error: 'bad' })
  })
})
