import { zValidator } from '@hono/zod-validator'
import { defineRouteFactory } from './define-route'
import { idParamSchema } from '../validation'

export const update = defineRouteFactory({
  method: 'patch',
  path: '/:id',
  kind: 'update',
  middleware: [zValidator('param', idParamSchema)],
  state: async ({ c }) => ({ id: idParamSchema.parse(c.req.param()).id, input: await c.req.json() }),
  action: async ({ c, context, state }) => {
    const data = await context.entity.source.update({ id: state.id, input: state.input, context })
    if (!data) return c.json({ error: 'not_found' }, 404)
    return c.json({ data })
  },
})
