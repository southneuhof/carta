import type { InferRequestType, InferResponseType } from 'hono/client'
import type { StatusCode } from 'hono/utils/http-status'
import type { CollectionLoadContext, CollectionResult, RecordIdentity, WebResourceSchema } from '@southneuhof/is-vue-framework'

export type HonoRequestOf<TEndpoint> = InferRequestType<TEndpoint>
export type HonoResponseOf<TEndpoint, TStatus extends StatusCode> = InferResponseType<TEndpoint, TStatus>

type EndpointAt<TRoute, TKey extends string, TMethod extends string> = TKey extends keyof TRoute
  ? TRoute[TKey] extends infer TNode
    ? TMethod extends keyof TNode
      ? TNode[TMethod]
      : never
    : never
  : never
type DetailEndpoint<TRoute, TMethod extends string> = 'detail' extends keyof TRoute
  ? TRoute['detail'] extends infer TDetail
    ? ':id' extends keyof TDetail
      ? TDetail[':id'] extends infer TNode
        ? TMethod extends keyof TNode
          ? TNode[TMethod]
          : never
        : never
      : never
    : never
  : never
type ListEndpoint<TRoute> = EndpointAt<TRoute, 'list', '$get'>
type DetailGetEndpoint<TRoute> = DetailEndpoint<TRoute, '$get'>
type CreateEndpoint<TRoute> = EndpointAt<TRoute, 'create', '$post'>
type UpdateEndpoint<TRoute> = 'update' extends keyof TRoute
  ? TRoute['update'] extends infer TUpdate
    ? ':id' extends keyof TUpdate
      ? TUpdate[':id'] extends infer TNode
        ? '$patch' extends keyof TNode
          ? TNode['$patch']
          : never
        : never
      : never
    : never
  : never
type DeleteEndpoint<TRoute> = 'delete' extends keyof TRoute
  ? TRoute['delete'] extends infer TDelete
    ? ':id' extends keyof TDelete
      ? TDelete[':id'] extends infer TNode
        ? '$delete' extends keyof TNode
          ? TNode['$delete']
          : never
        : never
      : never
    : never
  : never
type DataOf<T> = T extends { data: infer TValue } ? TValue : never
type ListRecordOf<T> = DataOf<T> extends readonly (infer TValue)[] ? TValue : never
type JsonOf<TEndpoint> = HonoRequestOf<TEndpoint> extends { json: infer TValue } ? TValue : Record<string, never>
type QueryOfEndpoint<TEndpoint> = HonoRequestOf<TEndpoint> extends { query: infer TValue } ? TValue : Record<string, never>
type ObjectJsonOf<TEndpoint> = JsonOf<TEndpoint> extends object ? JsonOf<TEndpoint> : Record<string, never>
type AdapterQuery<TWire extends object> = { [TKey in keyof TWire]?: TKey extends 'page' | 'limit' ? TWire[TKey] | number : TWire[TKey] }

export type HonoRecordOf<TRoute> = [ListEndpoint<TRoute>] extends [never]
  ? DataOf<HonoResponseOf<DetailGetEndpoint<TRoute>, 200>> extends object
    ? DataOf<HonoResponseOf<DetailGetEndpoint<TRoute>, 200>>
    : Record<string, unknown>
  : ListRecordOf<HonoResponseOf<ListEndpoint<TRoute>, 200>> extends object
  ? ListRecordOf<HonoResponseOf<ListEndpoint<TRoute>, 200>>
  : Record<string, unknown>
export type HonoQueryOf<TRoute> = [ListEndpoint<TRoute>] extends [never] ? Record<string, never> : AdapterQuery<QueryOfEndpoint<ListEndpoint<TRoute>> & object>
export type HonoCreateOf<TRoute> = ObjectJsonOf<CreateEndpoint<TRoute>>
export type HonoUpdateOf<TRoute> = ObjectJsonOf<UpdateEndpoint<TRoute>>

export type AppResourceContract<TRoute> = WebResourceSchema<HonoRecordOf<TRoute>, HonoQueryOf<TRoute>, HonoCreateOf<TRoute>, HonoUpdateOf<TRoute>, RecordIdentity>

type MutationRecordOf<TEndpoint, TStatus extends StatusCode> = DataOf<HonoResponseOf<TEndpoint, TStatus>> extends object ? DataOf<HonoResponseOf<TEndpoint, TStatus>> : Record<string, unknown>

export type HonoResourceActions<TRoute> = ([ListEndpoint<TRoute>] extends [never]
  ? {}
  : {
      list: (context: CollectionLoadContext<HonoQueryOf<TRoute>>) => Promise<CollectionResult<HonoRecordOf<TRoute>>>
    }) &
  ([DetailGetEndpoint<TRoute>] extends [never]
    ? {}
    : {
        detail: (context: { id?: RecordIdentity; searchParameters: Record<string, unknown>; signal?: AbortSignal }) => Promise<HonoRecordOf<TRoute> | undefined>
      }) &
  ([CreateEndpoint<TRoute>] extends [never]
    ? {}
    : {
        create: (input: HonoCreateOf<TRoute>) => Promise<MutationRecordOf<CreateEndpoint<TRoute>, 201>>
      }) &
  ([UpdateEndpoint<TRoute>] extends [never]
    ? {}
    : {
        update: (id: RecordIdentity, input: HonoUpdateOf<TRoute>) => Promise<MutationRecordOf<UpdateEndpoint<TRoute>, 200>>
      }) &
  ([DeleteEndpoint<TRoute>] extends [never]
    ? {}
    : {
        delete: (id: RecordIdentity) => Promise<HonoResponseOf<DeleteEndpoint<TRoute>, 200>>
      })
