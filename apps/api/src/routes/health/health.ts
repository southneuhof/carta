import { Hono } from 'hono'
import { mountRoute } from '@southneuhof/sprindle/routes'

const honoRoute = new Hono().get('/', (c) => c.json({ ok: true }))

export const mount = mountRoute({
  path: '/health',
  route: honoRoute,
})

export default { mount }
