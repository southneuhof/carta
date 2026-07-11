import type { CRUDDeleteOperation } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse } from './common'
import type { RpcCRUDResource } from './types'

export function createDeleteOperation(resource: RpcCRUDResource): CRUDDeleteOperation {
  return async (id) => {
    const response = await resource.delete[':id'].$delete({ param: { id: String(id) } })
    return parseRpcResponse(response)
  }
}
