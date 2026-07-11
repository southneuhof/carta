import type { RpcClient } from '@southneuhof/sdk'

export type RpcCRUDResource = RpcClient['users'] | RpcClient['roles'] | RpcClient['products']
