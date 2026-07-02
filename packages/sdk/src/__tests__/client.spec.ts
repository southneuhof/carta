import { describe, expect, it } from 'vitest'
import { createRpcClient, type RpcClient } from '../client'

describe('sdk createRpcClient', () => {
  it('creates native Hono RPC client shape', () => {
    const client = createRpcClient('http://localhost:8787')
    expect(client.products.list.$get).toBeTypeOf('function')
    expect(client.products.nested.test.versionTest.$get).toBeTypeOf('function')
  })

  it('keeps product proof calls typed', () => {
    const client = createRpcClient('http://localhost:8787')
    const typedClient: RpcClient = client

    function proofCalls(proofClient: RpcClient) {
      // @ts-expect-error missing route must stay absent
      proofClient.products.missing.$get()
      // @ts-expect-error missing nested route must stay absent
      proofClient.products.nested.test.missing.$get()

      return [
        proofClient.products.list.$get({ query: { page: '1', limit: '20' } }),
        proofClient.products.nested.version1.$get(),
        proofClient.products.nested.test.versionTest.$get(),
        proofClient.products.detail[':id'].$get({ param: { id: 'product-1' } }),
      ]
    }

    expect(proofCalls).toBeTypeOf('function')
    expect(typedClient.products.customProductAction.$post).toBeTypeOf('function')
  })
})
