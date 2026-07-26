/**
 * Shared plumbing for the three cores: the `data` XOR `load` rule and the
 * cache identity a core uses when no resource supplied a namespace.
 *
 * Cores stay resource-agnostic: no router, no permission store, no CRUD
 * operation names.
 */
import { getCurrentInstance } from 'vue'
import type { QueryKey, QueryNamespace, QueryValues, RecordIdentity } from '../../contracts'
import { stableValue } from '../../query'

export function assertSingleDataSource(component: string, data: unknown, load: unknown): void {
  if (data !== undefined && load !== undefined) {
    throw new Error(`[is-vue-framework] ${component} accepts either \`data\` or \`load\`, not both.`)
  }
}

/** Stable per-instance identity, used only when no namespace is supplied. */
export function instanceIdentity(fallback: string): string {
  const instance = getCurrentInstance()
  return instance ? `${fallback}-${instance.uid}` : fallback
}

export function collectionCacheKey(owner: string, query: QueryValues, searchParameters: QueryValues): QueryKey {
  return ['core', owner, 'list', stableValue({ ...searchParameters, ...query })]
}

export function recordCacheKey(owner: string, id: RecordIdentity | undefined, searchParameters: QueryValues): QueryKey {
  return ['core', owner, 'record', stableValue(id ?? null), stableValue(searchParameters)]
}

export function ownerOf(namespace: QueryNamespace | undefined, fallback: string): string {
  return namespace ?? instanceIdentity(fallback)
}
