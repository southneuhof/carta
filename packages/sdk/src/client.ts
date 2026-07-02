import { hc } from 'hono/client'
import type { AppType } from '@southneuhof/contracts'

export function createRpcClient(baseUrl: string) {
  return hc<AppType>(baseUrl, {
    init: {
      credentials: 'include',
    },
  })
}

export type RpcClient = ReturnType<typeof createRpcClient>
