import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, resolveRoute } from './common'

export const create: NonNullable<FrameworkCRUDRuntime['create']> = async ({ resource, input }) => {
  const operation = resolveRoute(resource).create
  if (!operation) throw new Error(`[web] RPC resource "${resource}" does not support create.`)
  const response = await operation.$post({ json: input })
  return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
}
