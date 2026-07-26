/**
 * Query state and query runtime contracts.
 *
 * Each table owns an independent query under a URL namespace. Core components
 * never import the router: URL reading and writing arrive through the location
 * adapter. Caching, deduplication, cancellation, and invalidation arrive
 * through the cache adapter, whose implementation (TanStack Query) stays
 * internal — public APIs expose `load`, `submit`, and namespaces, never query
 * keys or options.
 *
 * Plan 001 implements both adapters.
 */

import type { Load, LoadSignalContext, MaybePromise } from './load'

/** URL prefix distinguishing one table's query from its siblings. */
export type QueryNamespace = string

export type QueryValues = Record<string, unknown>

/**
 * Who owns a namespace. Two instances claiming one namespace is ambiguous and
 * requires an explicit `namespace` override on the ambiguous instance.
 */
export interface QueryOwnership {
  namespace: QueryNamespace
  owner: string
}

export interface QueryLocationAdapter {
  read: (namespace: QueryNamespace) => QueryValues
  write: (namespace: QueryNamespace, values: QueryValues) => void
  watch: (namespace: QueryNamespace, onChange: (values: QueryValues) => void) => () => void
}

/** Internal cache identity. Never authored by application developers. */
export type QueryKey = readonly unknown[]

export interface QueryFetchOptions<TResult> {
  key: QueryKey
  load: Load<LoadSignalContext, TResult>
  staleTime?: number
}

/** Matches every key starting with the given prefix. */
export interface QueryInvalidation {
  key: QueryKey
}

export interface QueryCacheAdapter {
  fetch: <TResult>(options: QueryFetchOptions<TResult>) => Promise<TResult>
  invalidate: (invalidation: QueryInvalidation) => MaybePromise<void>
}

export interface QueryAdapters {
  location: QueryLocationAdapter
  cache: QueryCacheAdapter
}
