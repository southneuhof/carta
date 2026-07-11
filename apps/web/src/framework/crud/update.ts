import type { CRUDRecord, CRUDUpdateOperation } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, serializeIdentity } from './common'
import type { RpcCRUDResource } from './types'

export function createUpdateOperation(resource: RpcCRUDResource): CRUDUpdateOperation {
  return async (id, input) => {
    const response = await resource.update[':id'].$patch({ param: { id: serializeIdentity(id) }, json: input } as never)
    return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
  }
}
