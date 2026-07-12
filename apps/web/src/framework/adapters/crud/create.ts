import type { FrameworkCRUDRuntime } from '@southneuhof/is-vue-framework'
import type { CRUDRecord } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { parseRpcResponse, type RpcCRUDResource } from './common'

export const create: NonNullable<FrameworkCRUDRuntime<RpcCRUDResource>['create']> = async ({ resource, input }) => {
  const response = await resource.create.$post({ json: input } as never)
  return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
}
