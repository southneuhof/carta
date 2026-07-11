import { describe, expect, expectTypeOf, it } from 'vitest'
import { createRpcClient, type RpcClient } from '../client'
import type { InferRequestType, InferResponseType } from 'hono/client'

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
    expect(typedClient.products.customProductRoute.$post).toBeTypeOf('function')
    type ListResponse = InferResponseType<RpcClient['products']['list']['$get'], 200>
    type CreateRequest = InferRequestType<RpcClient['products']['create']['$post']>
    type CustomResponse = InferResponseType<RpcClient['products']['customProductRoute']['$post'], 200>
    expectTypeOf<ListResponse>().toMatchTypeOf<{ data: Array<{ id: string; name: string; sku: string }> }>()
    expectTypeOf<CreateRequest>().toMatchTypeOf<{ json: { name: string; sku: string } }>()
    expectTypeOf<CustomResponse>().toMatchTypeOf<{ ok: true; route: string }>()
  })
})
