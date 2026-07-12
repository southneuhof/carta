import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, resolveRoute, serializeIdentity } from './common'

export const update: NonNullable<FrameworkCRUDRuntime['update']> = async ({ resource, id, input }) => {
  const response = await resolveRoute(resource).update[':id'].$patch({ param: { id: serializeIdentity(id) }, json: input })
  return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
}
