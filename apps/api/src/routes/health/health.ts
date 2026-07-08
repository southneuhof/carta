import { defineRoute, mountRoute } from '@southneuhof/sprindle/routes'

export const mount = mountRoute({
  path: '/health',
  route: defineRoute({
    method: 'get',
    action: async () => ({ ok: true }),
  }),
})

export default { mount }
