import { defineRouteFactory } from './define-route'

export const create = defineRouteFactory({
  method: 'post',
  kind: 'create',
  state: async ({ c }) => ({ input: await c.req.json() }),
  action: async ({ c, context, state }) => {
    const data = await context.entity.source.create({ input: state.input, context })
    return c.json({ data }, 201)
  },
})
