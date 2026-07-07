import { Hono } from 'hono'
import { defineRoute } from '@southneuhof/sprindle/routes'

const honoRoute = new Hono().get('/', (c) => c.json({ ok: true }))

export const route = defineRoute({
  path: '/health',
  route: honoRoute,
})

export default { route }
