import { describe, expect, expectTypeOf, it } from 'vitest'
import { createRpcClient, type RpcClient } from '../client'
import type { InferRequestType, InferResponseType } from 'hono/client'

describe('sdk createRpcClient', () => {
  it('creates the current Hono RPC client shape', () => {
    const client = createRpcClient('http://localhost:8787')
    expect(client.health.$get).toBeTypeOf('function')
    expect(client['business-categories'].list.$get).toBeTypeOf('function')
    expect(client['qhsse-pts'].list.$get).toBeTypeOf('function')
  })

  it('keeps ADS-HK calls typed and sample routes absent', () => {
    const client = createRpcClient('http://localhost:8787')
    const typedClient: RpcClient = client

    function proofCalls(proofClient: RpcClient) {
      // @ts-expect-error missing root route must stay absent
      proofClient.missing.$get()
      // @ts-expect-error removed sample route must stay absent
      proofClient.products.list.$get()
      // @ts-expect-error create only supports POST
      proofClient['business-categories'].create.$get({})
      // @ts-expect-error id param is required
      proofClient['business-categories'].detail[':id'].$get()

      return [
        proofClient.health.$get(),
        proofClient['business-categories'].list.$get({ query: { page: '1', limit: '20' } }),
        proofClient['qhsse-pts'].list.$get(),
      ]
    }

    expect(proofCalls).toBeTypeOf('function')
    type ListResponse = InferResponseType<RpcClient['business-categories']['list']['$get'], 200>
    type CreateRequest = InferRequestType<RpcClient['business-categories']['create']['$post']>
    expectTypeOf<ListResponse>().toMatchTypeOf<{ data: Array<{ id: string; code: string }> }>()
    expectTypeOf<CreateRequest>().toMatchTypeOf<{ json: { code: string; name: string } }>()
    expect(typedClient).toBe(client)
  })
})
