import type { Router } from 'vue-router'
import type { FrameworkAdaptersInput } from '@southneuhof/is-vue-framework'
import { dataAdapter } from './data/normalize'
import { createRouteQueryAdapter } from './query/routeQuery'

/** Project-specific adapter bundle installed with the framework plugin. */
export function createFrameworkAdapters(router: Router): FrameworkAdaptersInput {
  return {
    data: dataAdapter,
    query: createRouteQueryAdapter(router),
    queryDefaults: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  }
}
