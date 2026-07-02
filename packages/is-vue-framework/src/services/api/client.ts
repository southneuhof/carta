import { inject, type App, type InjectionKey } from 'vue'
import { createRpcClient, type RpcClient } from '@southneuhof/sdk'

export const IsApiClientKey: InjectionKey<RpcClient> = Symbol('IsApiClient')

export function createIsApiClient(baseUrl: string): RpcClient {
  return createRpcClient(baseUrl)
}

export function installIsApiClient(app: App, client: RpcClient) {
  app.provide(IsApiClientKey, client)
}

export function useIsApiClient(): RpcClient {
  const client = inject(IsApiClientKey)
  if (!client) throw new Error('Hono RPC client is not installed.')
  return client
}
