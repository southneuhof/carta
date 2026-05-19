import { describe, expect, it, vi } from 'vitest'
import { createAPIClient } from '../client'

describe('sdk createAPIClient', () => {
  it('uses normalized list/detail/create/update endpoints', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } }))
    const client = createAPIClient({
      baseURL: 'https://example.com/api/',
      fetchImpl: fetchMock as any,
    })

    await client.list('users', { search: 'a' })
    await client.detail('users', 10)
    await client.create('users', { name: 'A' })
    await client.update('users', { id: 10 })

    expect(fetchMock).toHaveBeenCalledTimes(4)
    const calls = fetchMock.mock.calls as any[]
    expect(calls[0][0]).toContain('/users/list')
    expect(calls[1][0]).toContain('/users/10/show')
    expect(calls[2][0]).toContain('/users/create')
    expect(calls[3][0]).toContain('/users/update')
  })

  it('detail supports composite identity in encoded path segments', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } }))
    const client = createAPIClient({
      baseURL: 'https://example.com/api/',
      fetchImpl: fetchMock as any,
    })

    await client.detail('articleTranslation', ['123', 'id with space/slash'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/articleTranslation/123/id%20with%20space%2Fslash/show')
  })

  it('calls unauthorized handler on 401', async () => {
    const onUnauthorized = vi.fn()
    const client = createAPIClient({
      baseURL: 'https://example.com/api/',
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ message: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })) as any,
      onUnauthorized,
    })

    await expect(client.get('me')).rejects.toBeTruthy()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
