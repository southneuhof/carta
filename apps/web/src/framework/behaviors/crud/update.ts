import type { FrameworkCRUDBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, serializeIdentity, type RpcCRUDResource } from './common'

export const update: NonNullable<FrameworkCRUDBehaviors<RpcCRUDResource>['update']> = async ({ resource, id, input }) => {
  const response = await resource.update[':id'].$patch({ param: { id: serializeIdentity(id) }, json: input } as never)
  return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
}
