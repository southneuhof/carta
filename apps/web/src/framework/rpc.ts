import { createRpcClient } from '@southneuhof/sdk'
import { defineRPCResources } from './adapters/crud'

const apiUrl = (() => {
  const raw = import.meta.env.VITE_API_URL || ''
  return raw && !raw.endsWith('/') ? `${raw}/` : raw
})()

export const rpc = createRpcClient(apiUrl)
export const resources = defineRPCResources(rpc)
