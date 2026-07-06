import { Hono } from 'hono'
import { defineRoute } from '@southneuhof/sprindle/routes'

const route = new Hono().get('/', (c) => c.json({ ok: true }))

export const healthRoute = defineRoute({
  path: '/health',
  route,
})
