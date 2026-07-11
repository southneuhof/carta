import type { CRUDListOperation, CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse } from './common'
import type { RpcCRUDResource } from './types'

export function createListOperation(resource: RpcCRUDResource): CRUDListOperation {
  return async (query = {}) => {
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
}
