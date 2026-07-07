import { describe, expect, it } from 'vitest'
import { createRpcClient, type RpcClient } from '../client'

describe('sdk createRpcClient', () => {
  it('creates native Hono RPC client shape', () => {
    const client = createRpcClient('http://localhost:8787')
    expect(client.health.$get).toBeTypeOf('function')
    expect(client.products.list.$get).toBeTypeOf('function')
    expect(client.products.gamer.test.versionTest.$get).toBeTypeOf('function')
  })

  it('keeps product proof calls typed', () => {
    const client = createRpcClient('http://localhost:8787')
    const typedClient: RpcClient = client

    function proofCalls(proofClient: RpcClient) {
      // @ts-expect-error missing root route must stay absent
      proofClient.missing.$get()
      // @ts-expect-error missing route must stay absent
      proofClient.products.missing.$get()
      // @ts-expect-error missing nested route must stay absent
      proofClient.products.gamer.test.missing.$get()
      // @ts-expect-error create only supports POST
      proofClient.products.create.$get({})
      // @ts-expect-error id param is required
      proofClient.products.detail[':id'].$get()
      // @ts-expect-error body must be under json
      proofClient.products.create.$post({ name: 'Product' })
      // @ts-expect-error product name must be a string
      proofClient.products.create.$post({ json: { name: 1 } })

      return [
        proofClient.health.$get(),
        proofClient.products.list.$get({ query: { page: '1', limit: '20' } }),
        proofClient.products.gamer.version1.$get(),
        proofClient.products.gamer.test.versionTest.$get(),
        proofClient.products.detail[':id'].$get({ param: { id: 'product-1' } }),
      ]
    }

    expect(proofCalls).toBeTypeOf('function')
    expect(typedClient.products.customProductAction.$post).toBeTypeOf('function')
  })
})
