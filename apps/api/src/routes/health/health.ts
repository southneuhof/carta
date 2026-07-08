import { Hono } from 'hono'
import { defineRoute, mountRoute } from '@southneuhof/sprindle/routes'

// const honoRoute = new Hono().get('/', (c) => c.json({ ok: true }))

export const mount = mountRoute({
  path: '/health',
  route: defineRoute({
    method: 'get',
    action: async () => ({ ok: true }),
  }),
})

export default { mount }
