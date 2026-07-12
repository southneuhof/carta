import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import { parseRpcResponse, type RpcCRUDResource } from './common'

export const deleteOperation: NonNullable<FrameworkCRUDRuntime<RpcCRUDResource>['delete']> = async ({ resource, id }) => {
  const response = await resource.delete[':id'].$delete({ param: { id: String(id) } })
  return parseRpcResponse(response)
}
