import type { CRUDIdentity, CRUDQuery, CRUDRecord, CRUDResource } from '@southneuhof/is-vue-framework/adapters/crud-operations'

type AsyncFunction = (...args: any[]) => Promise<any>
type HasCRUDRoutes = { list: unknown; detail: unknown; update: unknown }
type JsonOf<TFunction extends AsyncFunction> = Awaited<ReturnType<Awaited<ReturnType<TFunction>>['json']>>
type DataOf<TFunction extends AsyncFunction> = Extract<JsonOf<TFunction>, { data: unknown }>['data']
type ListFunction<TRoute> = TRoute extends { list: { $get: infer TFunction extends AsyncFunction } } ? TFunction : never
type DetailFunction<TRoute> = TRoute extends { detail: { ':id': { $get: infer TFunction extends AsyncFunction } } } ? TFunction : never
type UpdateFunction<TRoute> = TRoute extends { update: { ':id': { $patch: infer TFunction extends AsyncFunction } } } ? TFunction : never
type CreateFunction<TRoute> = TRoute extends { create: { $post: infer TFunction extends AsyncFunction } } ? TFunction : never
type ListRecord<TRoute> = DataOf<ListFunction<TRoute>> extends Array<infer TRecord extends CRUDRecord> ? TRecord : CRUDRecord
type RequestOf<TFunction> = TFunction extends AsyncFunction ? NonNullable<Parameters<TFunction>[0]> : never
type QueryOf<TRoute> = RequestOf<ListFunction<TRoute>> extends { query?: infer TQuery extends CRUDQuery } ? NonNullable<TQuery> : CRUDQuery
type InputOf<TFunction> = [TFunction] extends [never] ? never : RequestOf<TFunction> extends { json: infer TInput extends CRUDRecord } ? TInput : never
type IdentityOf<TRoute> = RequestOf<DetailFunction<TRoute>> extends { param: { id: infer TIdentity } } ? Extract<TIdentity, CRUDIdentity> : string

export type RPCResources<TClient> = {
  [TKey in keyof TClient as TKey extends string ? TClient[TKey] extends HasCRUDRoutes ? TKey : never : never]: TClient[TKey] extends HasCRUDRoutes
    ? CRUDResource<Extract<TKey, string>, ListRecord<TClient[TKey]>, InputOf<CreateFunction<TClient[TKey]>>, InputOf<UpdateFunction<TClient[TKey]>>, QueryOf<TClient[TKey]>, IdentityOf<TClient[TKey]>>
    : never
}

/** Builds inert resource names. TClient supplies contract metadata only. */
export function defineRPCResources<TClient extends object>(): RPCResources<TClient> {
  return new Proxy({} as RPCResources<TClient>, {
    get(_target, property) {
      if (typeof property !== 'string') return undefined
      return property
    },
  })
}
