import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, serializeIdentity, type RpcCRUDResource } from './common'

export const detail: NonNullable<FrameworkCRUDRuntime<RpcCRUDResource>['detail']> = async ({ resource, id }) => {
  const response = await resource.detail[':id'].$get({ param: { id: serializeIdentity(id) } })
  return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
}
