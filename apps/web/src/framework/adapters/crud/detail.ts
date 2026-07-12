import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, resolveRoute, serializeIdentity } from './common'

export const detail: NonNullable<FrameworkCRUDRuntime['detail']> = async ({ resource, id }) => {
  const response = await resolveRoute(resource).detail[':id'].$get({ param: { id: serializeIdentity(id) } })
  return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
}
