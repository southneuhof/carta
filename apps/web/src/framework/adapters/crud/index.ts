import type { CRUDIdentity, CRUDQuery, CRUDRecord, CRUDResource } from '@southneuhof/is-vue-framework/adapters/crud-operations'

type AsyncFunction = (...args: any[]) => Promise<any>
type CRUDRoute = {
  list: { $get: AsyncFunction }
  detail: { ':id': { $get: AsyncFunction } }
  create?: { $post: AsyncFunction }
  update: { ':id': { $patch: AsyncFunction } }
  delete?: { ':id': { $delete: AsyncFunction } }
}
type HasCRUDRoutes = { list: unknown; detail: unknown; update: unknown }

type JsonOf<TFunction extends AsyncFunction> = Awaited<ReturnType<Awaited<ReturnType<TFunction>>['json']>>
type DataOf<TFunction extends AsyncFunction> = Extract<JsonOf<TFunction>, { data: unknown }>['data']
type ListFunction<TRoute> = TRoute extends { list: { $get: infer TFunction extends AsyncFunction } } ? TFunction : AsyncFunction
type DetailFunction<TRoute> = TRoute extends { detail: { ':id': { $get: infer TFunction extends AsyncFunction } } } ? TFunction : AsyncFunction
type UpdateFunction<TRoute> = TRoute extends { update: { ':id': { $patch: infer TFunction extends AsyncFunction } } } ? TFunction : AsyncFunction
type ListRecord<TRoute> = DataOf<ListFunction<TRoute>> extends Array<infer TRecord extends CRUDRecord> ? TRecord : CRUDRecord
type RequestOf<TFunction extends AsyncFunction> = NonNullable<Parameters<TFunction>[0]>
type QueryOf<TRoute> = RequestOf<ListFunction<TRoute>> extends { query?: infer TQuery extends CRUDQuery } ? NonNullable<TQuery> : CRUDQuery
type InputOf<TFunction extends AsyncFunction> = RequestOf<TFunction> extends { json: infer TInput extends CRUDRecord } ? TInput : CRUDRecord
type RouteFunction<TValue, TKey extends PropertyKey> = TValue extends Record<TKey, infer TFunction extends AsyncFunction> ? TFunction : AsyncFunction
type IdentityOf<TRoute> = RequestOf<DetailFunction<TRoute>> extends { param: { id: infer TIdentity } }
  ? Extract<TIdentity, CRUDIdentity>
  : string

export type RPCResources<TClient> = {
  [TKey in keyof TClient as TClient[TKey] extends HasCRUDRoutes ? TKey : never]: TClient[TKey] extends HasCRUDRoutes
    ? CRUDResource<ListRecord<TClient[TKey]>, InputOf<RouteFunction<TClient[TKey] extends { create: infer TCreate } ? TCreate : never, '$post'>>, InputOf<UpdateFunction<TClient[TKey]>>, QueryOf<TClient[TKey]>, IdentityOf<TClient[TKey]>>
    : never
}

export async function parseRpcResponse<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (!response.ok) throw payload
  return payload as T
}

function serializeIdentity(id: CRUDIdentity | CRUDIdentity[]) {
  return Array.isArray(id) ? id.join('/') : String(id)
}

function normalizeQuery(query: CRUDQuery = {}) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]))
}

function bindResource(route: CRUDRoute): CRUDResource {
  return {
    async list(query = {}) {
      const response = await route.list.$get({ query: normalizeQuery(query) })
      const result = await parseRpcResponse<{ data: CRUDRecord[]; total?: number; limit?: number }>(response)
      return { data: result.data, total: result.total, totalPage: result.total != null && result.limit ? Math.ceil(result.total / result.limit) : undefined }
    },
    async detail(id) {
      const response = await route.detail[':id'].$get({ param: { id: serializeIdentity(id) } })
      return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
    },
    async create(input) {
      if (!route.create) throw new Error('[web] RPC resource does not support create.')
      const response = await route.create.$post({ json: input })
      return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
    },
    async update(id, input) {
      const response = await route.update[':id'].$patch({ param: { id: serializeIdentity(id) }, json: input })
      return (await parseRpcResponse<{ data: CRUDRecord }>(response)).data
    },
    async delete(id) {
      if (!route.delete) throw new Error('[web] RPC resource does not support delete.')
      const response = await route.delete[':id'].$delete({ param: { id: String(id) } })
      return parseRpcResponse(response)
    },
  }
}

export function defineRPCResources<TClient extends object>(rpc: TClient): RPCResources<TClient> {
  const cache = new Map<PropertyKey, CRUDResource>()
  return new Proxy({} as RPCResources<TClient>, {
    get(_target, property) {
      let resource = cache.get(property)
      if (!resource) {
        resource = bindResource((rpc as Record<PropertyKey, CRUDRoute>)[property])
        cache.set(property, resource)
      }
      return resource
    },
  })
}
