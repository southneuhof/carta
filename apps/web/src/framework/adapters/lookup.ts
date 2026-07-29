import type { CollectionLoadContext, CollectionResult, RecordLoadContext, RecordResult } from '@southneuhof/is-vue-framework'
export function createLookupLoad<TRecord extends Record<string, unknown>>(endpoint: string) {
  return async ({ query, searchParameters, signal }: CollectionLoadContext): Promise<CollectionResult<TRecord>> => {
    const services = (await import('@/utils/services')).default
    const { data, total, totalPage } = await services.dataset(endpoint, {
      active: true,
      ...searchParameters,
      ...query,
    }, { init: { signal } })
    return { data, meta: { total, totalPage } }
  }
}

export function createLookupDetail<TRecord extends Record<string, unknown>>(endpoint: string) {
  return async ({ id, searchParameters, signal }: RecordLoadContext): Promise<RecordResult<TRecord>> => {
    const services = (await import('@/utils/services')).default
    const { data } = await services.detail(endpoint, id as string | number, {
      active: true,
      ...searchParameters,
    }, { init: { signal } })
    return data
  }
}
