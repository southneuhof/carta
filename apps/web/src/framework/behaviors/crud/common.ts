import type { RpcClient } from '@southneuhof/sdk'

type WithCRUDRoutes<T> = T extends {
  list: unknown
  detail: unknown
  create: unknown
  update: unknown
  delete: unknown
}
  ? T
  : never

export type RpcCRUDResource = WithCRUDRoutes<RpcClient[keyof RpcClient]>

export async function parseRpcResponse<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (!response.ok) throw payload
  return payload as T
}

export function serializeIdentity(id: string | number | Array<string | number>) {
  return Array.isArray(id) ? id.join('/') : String(id)
}
