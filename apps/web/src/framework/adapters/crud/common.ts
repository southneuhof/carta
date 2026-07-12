import type { RpcClient } from '@southneuhof/sdk'
import type { CRUDResource } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { rpc } from '@/framework/rpc'

type AsyncFunction = (...args: any[]) => Promise<any>

export type RpcCRUDRoute = {
  list: { $get: AsyncFunction }
  detail: { ':id': { $get: AsyncFunction } }
  create?: { $post: AsyncFunction }
  update: { ':id': { $patch: AsyncFunction } }
  delete?: { ':id': { $delete: AsyncFunction } }
}

export function resolveRoute(resource: CRUDResource): RpcCRUDRoute {
  return (rpc as RpcClient & Record<string, RpcCRUDRoute>)[resource as string]
}

export async function parseRpcResponse<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (!response.ok) throw payload
  return payload as T
}

export function serializeIdentity(id: string | number | Array<string | number>) {
  return Array.isArray(id) ? id.join('/') : String(id)
}
