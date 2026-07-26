import type { Router } from 'vue-router'
import type { FrameworkAdaptersInput } from '@southneuhof/is-vue-framework'
import { dataAdapter } from './data/normalize'
import { createRouteQueryAdapter } from './query/routeQuery'

/**
 * Project-specific adapter bundle installed with the framework plugin.
 *
 * There is no `schemas` adapter: resources declare `schemas` directly from the API
 * entity modules, which is the documented path and the only one now that the mirror
 * is gone. `SchemaAdapter` remains an optional framework seam for projects whose
 * schemas do not travel with their resource definitions.
 */
export function createFrameworkAdapters(router: Router): FrameworkAdaptersInput {
  return {
    data: dataAdapter,
    query: createRouteQueryAdapter(router),
    queryDefaults: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  }
}
