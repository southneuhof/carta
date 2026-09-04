import { defineRoute } from '@southneuhof/sprindle/routes'

export const healthRoute = defineRoute({
  path: '/health',
  method: 'get',
  action: async () => ({ ok: true }),
})

export default { healthRoute }
