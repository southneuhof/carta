import type { FrameworkCRUDBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { parseRpcResponse, type RpcCRUDResource } from './common'

export const deleteOperation: NonNullable<FrameworkCRUDBehaviors<RpcCRUDResource>['delete']> = async ({ resource, id }) => {
  const response = await resource.delete[':id'].$delete({ param: { id: String(id) } })
  return parseRpcResponse(response)
}
