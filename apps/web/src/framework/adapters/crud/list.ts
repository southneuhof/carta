import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, type RpcCRUDResource } from './common'

export const list: NonNullable<FrameworkCRUDRuntime<RpcCRUDResource>['list']> = async ({ resource, query = {} }) => {
  const normalizedQuery = Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  )
  const response = await resource.list.$get({ query: normalizedQuery })
  const result = await parseRpcResponse<{ data: CRUDRecord[]; total?: number; page?: number; limit?: number }>(response)
  const totalPage = result.total != null && result.limit ? Math.ceil(result.total / result.limit) : undefined
  return { data: result.data, total: result.total, totalPage }
}
