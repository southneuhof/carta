import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, resolveRoute } from './common'

export const list: NonNullable<FrameworkCRUDRuntime['list']> = async ({ resource, query = {} }) => {
  const normalizedQuery = Object.fromEntries(Object.entries(query).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]))
  const response = await resolveRoute(resource).list.$get({ query: normalizedQuery })
  const result = await parseRpcResponse<{ data: CRUDRecord[]; total?: number; limit?: number }>(response)
  return { data: result.data, total: result.total, totalPage: result.total != null && result.limit ? Math.ceil(result.total / result.limit) : undefined }
}
