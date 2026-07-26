/**
 * Universal load contract.
 *
 * A loader may return local, synchronous, cached, or remote asynchronous data.
 * The source is an implementation detail; components only require a normalized
 * result. `data` and `load` are alternatives — supplying both is a development
 * error reported at runtime by the core components.
 */

export type MaybePromise<T> = T | Promise<T>

/** Cancellation context shared by every loader invocation. */
export interface LoadSignalContext {
  signal?: AbortSignal
}

export type Load<TContext, TResult> = (context: TContext) => MaybePromise<TResult>

/** Context handed to a collection loader. */
export interface CollectionLoadContext<TQuery = Record<string, unknown>> extends LoadSignalContext {
  query: TQuery
  searchParameters: Record<string, unknown>
}

/** Context handed to a single-record loader. */
export interface RecordLoadContext extends LoadSignalContext {
  id?: RecordIdentity
  searchParameters: Record<string, unknown>
}

/** Stable identity of one record. */
export type RecordIdentity = string | number
