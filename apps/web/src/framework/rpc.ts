import { createRpcClient } from '@southneuhof/sdk'

export const apiUrl = (() => {
  const raw = import.meta.env.VITE_API_URL || ''
  return raw && !raw.endsWith('/') ? `${raw}/` : raw
})()

export const rpc = createRpcClient(apiUrl)
