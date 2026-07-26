import type { ResourceOperations } from '@southneuhof/is-vue-framework'
import { parseRpcResponse, resolveRoute, serializeIdentity, type RpcCRUDRoute } from './rpcRoute'
import { normalizeCollection, normalizeRecord } from '../data/normalize'

/**
 * Derives ordinary resource operations from an RPC route.
 *
 * Only the operations the route actually exposes are produced, so resource
 * capability inference — and therefore standard control visibility — follows
 * the backend contract. Local, offline, or custom resources simply pass their
 * own operations to `defineResource` instead.
 */

function queryValues(query: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value != null && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
}

export function createRpcOperations<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate
>(route: RpcCRUDRoute): ResourceOperations<TRecord, TQuery, TCreate, TUpdate> {
  const operations: ResourceOperations<TRecord, TQuery, TCreate, TUpdate> = {}

  if (route.list) {
    operations.list = async ({ query, searchParameters }) => {
      const response = await route.list.$get({ query: queryValues({ ...searchParameters, ...query }) })
      return normalizeCollection<TRecord>(await parseRpcResponse(response))
    }
  }

  if (route.detail) {
    operations.detail = async ({ id, searchParameters }) => {
      if (id === undefined) return undefined
      const response = await route.detail[':id'].$get({
        param: { id: serializeIdentity(id) },
        query: queryValues(searchParameters),
      })
      return normalizeRecord<TRecord>(await parseRpcResponse(response))
    }
  }

  if (route.create) {
    operations.create = async (input) => parseRpcResponse(await route.create!.$post({ json: input }))
  }

  if (route.update) {
    operations.update = async (id, input) => parseRpcResponse(await route.update[':id'].$patch({ param: { id: serializeIdentity(id) }, json: input }))
  }

  if (route.delete) {
    operations.delete = async (id) => parseRpcResponse(await route.delete![':id'].$delete({ param: { id: serializeIdentity(id) } }))
  }

  return operations
}

/** Resolves the RPC route registered under a resource name. */
export function rpcOperations<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate
>(resource: string): ResourceOperations<TRecord, TQuery, TCreate, TUpdate> {
  return createRpcOperations<TRecord, TQuery, TCreate, TUpdate>(resolveRoute(resource))
}
