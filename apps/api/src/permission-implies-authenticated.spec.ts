import { afterAll, describe, expect, it } from 'vitest'
import { app } from './app'
import { closeDb } from './db'

describe('requirePermission implies authentication', () => {
  it('answers 401 for anonymous requests to permission-guarded routes', async () => {
    expect((await app.request('/users/list')).status).toBe(401)
    expect((await app.request('/roles/list')).status).toBe(401)
    expect((await app.request('/permissions/list')).status).toBe(401)
    const create = await app.request('/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Anonymous' }),
    })
    expect(create.status).toBe(401)
  })
})

afterAll(() => closeDb())
