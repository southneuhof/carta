import { defineRouteFactory } from './define-route'
import { listQuerySchema } from '../validation'

export const list = defineRouteFactory({
  method: 'get',
  kind: 'list',
  state: ({ c }) => ({ query: listQuerySchema.parse(c.req.query()) }),
  action: async ({ c, context, state }) => {
    const query = state.query
    try {
      const result = await context.entity.source.list({ query, context })
      const data = Array.isArray(result) ? result : result.data
      const total = Array.isArray(result) ? data.length : result.total
      return c.json({ data, page: query.page, limit: query.limit, total })
    } catch (error) {
      if (isValidationError(error)) return c.json({ error: 'validation_error', message: error.message }, error.status)
      throw error
    }
  },
})

function isValidationError(error: unknown): error is Error & { status: 400 } {
  return Boolean(error && typeof error === 'object' && (error as { status?: unknown }).status === 400)
}
