import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { isHttpError } from '@southneuhof/sprindle'
import { readJsonBody } from './request-body'

const app = new Hono().onError((error, c) => {
  const http = isHttpError(error) ? error : undefined
  if (!http) throw error
  return c.json({ error: http.code, message: http.message }, http.status as 400)
})
app.post('/probe', async (c) => c.json(await readJsonBody(c)))

describe('readJsonBody', () => {
  it.each([
    ['object body', '{"a":1}', { a: 1 }],
    ['empty body', '', {}],
    ['whitespace body', '   ', {}],
  ])('parses %s', async (_label, raw, expected) => {
    const response = await app.request('/probe', { method: 'POST', body: raw })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expected)
  })

  it.each([
    ['malformed JSON', '{broken'],
    ['array body', '[1,2]'],
    ['primitive body', '42'],
    ['null body', 'null'],
  ])('answers 400 for %s', async (_label, raw) => {
    const response = await app.request('/probe', { method: 'POST', body: raw })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_error')
    expect(typeof body.message).toBe('string')
  })
})
