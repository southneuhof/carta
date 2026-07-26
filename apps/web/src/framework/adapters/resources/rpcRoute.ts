import type { RpcClient } from '@southneuhof/sdk'
import { rpc } from '@/framework/rpc'

/**
 * Shape of an RPC route this project exposes for a resource. Only the
 * operations a route actually declares are derived, so resource capabilities
 * follow the backend contract.
 */
type AsyncFunction = (...args: any[]) => Promise<any>

export type RpcCRUDRoute = {
  list: { $get: AsyncFunction }
  detail: { ':id': { $get: AsyncFunction } }
  create?: { $post: AsyncFunction }
  update: { ':id': { $patch: AsyncFunction } }
  delete?: { ':id': { $delete: AsyncFunction } }
}

export function resolveRoute(resource: string): RpcCRUDRoute {
  return (rpc as RpcClient & Record<string, RpcCRUDRoute>)[resource]
}

export async function parseRpcResponse<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (!response.ok) throw payload
  return payload as T
}

export function serializeIdentity(id: string | number | Array<string | number>) {
  return Array.isArray(id) ? id.join('/') : String(id)
}
