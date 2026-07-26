import { defineRouteFactory } from './define-route'
import { listQuerySchema } from '../validation'

export const list = defineRouteFactory({
  method: 'get',
  kind: 'list',
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async ({ c, context, state }) => {
    const query = state.query
    const result = await context.entity.source.list({ query, context })
    const data = Array.isArray(result) ? result : result.data
    const total = Array.isArray(result) ? data.length : result.total
    return c.json({ data, page: query.page, limit: query.limit, total })
  },
})
