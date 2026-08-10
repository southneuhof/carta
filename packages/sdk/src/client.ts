import { hc } from 'hono/client'
import type { ClientRequestOptions } from 'hono'
import type { AppType } from '@southneuhof/api/rpc'

export function createRpcClient(baseUrl: string, options: ClientRequestOptions = {}) {
  // @ts-ignore Hono's generated union is too complex in the web compiler.
  return hc<AppType>(baseUrl, {
    ...options,
    init: {
      credentials: 'include',
      ...options.init,
    },
  })
}

export type RpcClient = ReturnType<typeof createRpcClient>
