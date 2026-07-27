import type { InferRequestType, InferResponseType } from 'hono/client'
import type { StatusCode } from 'hono/utils/http-status'
import type { CollectionResult, RecordIdentity } from '../contracts'
import { defaultDataAdapter, type DataAdapter } from '../adapters/projectAdapters'
import type { ResourceOperations } from '../resources/defineResource'

/** Exact Hono request input. This stays type-only. */
export type HonoRequestOf<TEndpoint> = InferRequestType<TEndpoint>
/** Exact Hono response payload for one status. This stays type-only. */
export type HonoResponseOf<TEndpoint, TStatus extends StatusCode> = InferResponseType<TEndpoint, TStatus>

/** Parse one typed Hono response once; non-success payloads stay thrown. */
export async function parseHonoResponse<TEndpoint, TStatus extends StatusCode = 200>(response: Response): Promise<HonoResponseOf<TEndpoint, TStatus>> {
  const value: unknown = await response.json()
  if (!response.ok) throw value
  return value as HonoResponseOf<TEndpoint, TStatus>
}

type EndpointAt<TRoute, TKey extends string, TMethod extends string> = TKey extends keyof TRoute
  ? TRoute[TKey] extends infer TNode
    ? TMethod extends keyof TNode ? TNode[TMethod] : never
    : never
  : never
type DetailEndpoint<TRoute, TMethod extends string> = 'detail' extends keyof TRoute
  ? TRoute['detail'] extends infer TDetail
    ? ':id' extends keyof TDetail
      ? TDetail[':id'] extends infer TNode
        ? TMethod extends keyof TNode ? TNode[TMethod] : never
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
      ? TUpdate[':id'] extends infer TDetail
        ? '$patch' extends keyof TDetail ? TDetail['$patch'] : never
        : never
      : never
    : never
  : never
type DeleteEndpoint<TRoute> = 'delete' extends keyof TRoute
  ? TRoute['delete'] extends infer TDelete
    ? ':id' extends keyof TDelete
      ? TDelete[':id'] extends infer TDetail
        ? '$delete' extends keyof TDetail ? TDetail['$delete'] : never
        : never
      : never
    : never
  : never
type DataOf<T> = T extends { data: infer TValue } ? TValue : never
type ListRecordOf<T> = DataOf<T> extends readonly (infer TValue)[] ? TValue : never
type JsonOf<TEndpoint> = HonoRequestOf<TEndpoint> extends { json: infer TValue } ? TValue : Record<string, never>
type WireQueryOf<TEndpoint> = HonoRequestOf<TEndpoint> extends { query: infer TValue } ? TValue : Record<string, never>
type ObjectJsonOf<TEndpoint> = JsonOf<TEndpoint> extends object ? JsonOf<TEndpoint> : Record<string, never>
type AdapterQuery<TWire extends object> = {
  [TKey in keyof TWire]: TKey extends 'page' | 'limit' ? TWire[TKey] | number : TWire[TKey]
}
type RecordOf<TRoute> = [ListEndpoint<TRoute>] extends [never]
  ? DataOf<HonoResponseOf<DetailGetEndpoint<TRoute>, 200>>
  : ListRecordOf<HonoResponseOf<ListEndpoint<TRoute>, 200>>
type QueryOf<TRoute> = [ListEndpoint<TRoute>] extends [never] ? Record<string, never> : AdapterQuery<WireQueryOf<ListEndpoint<TRoute>> & object>
type OperationMetadata<TRecord extends object, TQuery extends object, TCreate extends object, TUpdate extends object> = {
  /** Compile-time only; the runtime adapter never creates these keys. */
  readonly __record: TRecord
  readonly __query: TQuery
  readonly __create: TCreate
  readonly __update: TUpdate
  readonly __identity: RecordIdentity
}
type ListOperation<TRoute, TRecord extends object, TQuery extends object> = [ListEndpoint<TRoute>] extends [never]
  ? {} : { list: (context: Parameters<NonNullable<ResourceOperations<TRecord, TQuery>['list']>>[0]) => Promise<CollectionResult<TRecord>> }
type DetailOperation<TRoute, TRecord extends object> = [DetailGetEndpoint<TRoute>] extends [never]
  ? {} : { detail: (context: Parameters<NonNullable<ResourceOperations<TRecord, Record<string, never>, Record<string, never>, Record<string, never>, RecordIdentity>['detail']>>[0]) => Promise<TRecord | undefined> }
type MutationRecordOf<TEndpoint, TStatus extends StatusCode> = DataOf<HonoResponseOf<TEndpoint, TStatus>> extends object
  ? DataOf<HonoResponseOf<TEndpoint, TStatus>>
  : never
type CreateOperation<TRoute, TCreate extends object> = [CreateEndpoint<TRoute>] extends [never]
  ? {} : [MutationRecordOf<CreateEndpoint<TRoute>, 201>] extends [never]
    ? never
    : { create: (input: TCreate) => Promise<MutationRecordOf<CreateEndpoint<TRoute>, 201>> }
type UpdateOperation<TRoute, TUpdate extends object> = [UpdateEndpoint<TRoute>] extends [never]
  ? {} : [MutationRecordOf<UpdateEndpoint<TRoute>, 200>] extends [never]
    ? never
    : { update: (id: RecordIdentity, input: TUpdate) => Promise<MutationRecordOf<UpdateEndpoint<TRoute>, 200>> }
type DeleteOperation<TRoute> = [DeleteEndpoint<TRoute>] extends [never]
  ? {} : { delete: (id: RecordIdentity) => Promise<HonoResponseOf<DeleteEndpoint<TRoute>, 200>> }

/**
 * Runtime always creates conventional wrappers because Hono `hc()` proxies
 * cannot reveal which branches exist. Public keys remain exact from `TRoute`.
 * Never enumerate this object for capability truth; use typed actions for UI.
 * When Hono changes, rerun both the compile-time key fixture and the universal
 * proxy runtime fixture before accepting the upgrade.
 */
export type HonoResourceOperations<TRoute> = RecordOf<TRoute> extends object
  ? ListOperation<TRoute, RecordOf<TRoute>, QueryOf<TRoute>>
    & DetailOperation<TRoute, RecordOf<TRoute>>
    & CreateOperation<TRoute, ObjectJsonOf<CreateEndpoint<TRoute>>>
    & UpdateOperation<TRoute, ObjectJsonOf<UpdateEndpoint<TRoute>>>
    & DeleteOperation<TRoute>
    & OperationMetadata<RecordOf<TRoute>, QueryOf<TRoute>, ObjectJsonOf<CreateEndpoint<TRoute>>, ObjectJsonOf<UpdateEndpoint<TRoute>>>
  : never

type RuntimeEndpoint = (input?: unknown) => Promise<Response>
type RuntimeRoute = {
  list: { $get: RuntimeEndpoint }
  detail: { ':id': { $get: RuntimeEndpoint } }
  create: { $post: RuntimeEndpoint }
  update: { ':id': { $patch: RuntimeEndpoint } }
  delete: { ':id': { $delete: RuntimeEndpoint } }
}

function wireQuery(values: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value != null && value !== '').map(([key, value]) => [key, String(value)]))
}
function identity(id: RecordIdentity): string {
  return typeof id === 'object' ? Object.values(id).map(String).join('/') : String(id)
}
async function payload(response: Response): Promise<unknown> {
  const value = await response.json()
  if (!response.ok) throw value
  return value
}
function typedOperations<T>(operations: object): T {
  return operations as T
}

export function createHonoResourceOperations<const TRoute>(route: TRoute, dataAdapter: Pick<DataAdapter, 'normalizeCollection' | 'normalizeRecord'> = defaultDataAdapter): HonoResourceOperations<TRoute> {
  const source = route as RuntimeRoute
  const operations = {
    list: async ({ query, searchParameters }: { query: Record<string, unknown>; searchParameters: Record<string, unknown> }) =>
      dataAdapter.normalizeCollection(await payload(await source.list.$get({ query: wireQuery({ ...searchParameters, ...query }) }))),
    detail: async ({ id, searchParameters }: { id: RecordIdentity; searchParameters: Record<string, unknown> }) => {
      if (id === undefined) return undefined
      const value = await payload(await source.detail[':id'].$get({ param: { id: identity(id) }, query: wireQuery(searchParameters) }))
      return dataAdapter.normalizeRecord(value)
    },
    create: async (input: object) => dataAdapter.normalizeRecord(await payload(await source.create.$post({ json: input }))),
    update: async (id: RecordIdentity, input: object) => dataAdapter.normalizeRecord(await payload(await source.update[':id'].$patch({ param: { id: identity(id) }, json: input }))),
    delete: async (id: RecordIdentity) => payload(await source.delete[':id'].$delete({ param: { id: identity(id) } })),
  }
  return typedOperations<HonoResourceOperations<TRoute>>(operations)
}
