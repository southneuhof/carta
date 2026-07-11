import type { CRUDDetailOperation, CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, serializeIdentity } from './common'
import type { RpcCRUDResource } from './types'

export function createDetailOperation(resource: RpcCRUDResource): CRUDDetailOperation {
  return async (id) => {
    const response = await resource.detail[':id'].$get({ param: { id: serializeIdentity(id) } })
    return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
  }
}
