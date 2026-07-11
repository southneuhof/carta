import type { CRUDMutationOperation, CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse } from './common'
import type { RpcCRUDResource } from './types'

export function createCreateOperation(resource: RpcCRUDResource): CRUDMutationOperation {
  return async (input) => {
    const response = await resource.create.$post({ json: input } as never)
    return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
  }
}
