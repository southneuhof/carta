import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import { parseRpcResponse, resolveRoute } from './common'

export const deleteOperation: NonNullable<FrameworkCRUDRuntime['delete']> = async ({ resource, id }) => {
  const operation = resolveRoute(resource).delete
  if (!operation) throw new Error(`[web] RPC resource "${resource}" does not support delete.`)
  const response = await operation[':id'].$delete({ param: { id: String(id) } })
  return parseRpcResponse(response)
}
