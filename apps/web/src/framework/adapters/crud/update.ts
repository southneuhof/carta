import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, serializeIdentity, type RpcCRUDResource } from './common'

export const update: NonNullable<FrameworkCRUDRuntime<RpcCRUDResource>['update']> = async ({ resource, id, input }) => {
  const response = await resource.update[':id'].$patch({ param: { id: serializeIdentity(id) }, json: input } as never)
  return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
}
