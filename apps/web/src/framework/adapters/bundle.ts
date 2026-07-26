import type { Router } from 'vue-router'
import type { FrameworkAdaptersInput } from '@southneuhof/is-vue-framework'
import { dataAdapter } from './data/normalize'
import { createRouteQueryAdapter } from './query/routeQuery'
import { schemaAdapter } from './validation/schemas'

/** Project-specific adapter bundle installed with the framework plugin. */
export function createFrameworkAdapters(router: Router): FrameworkAdaptersInput {
  return {
    data: dataAdapter,
    query: createRouteQueryAdapter(router),
    schemas: schemaAdapter,
    queryDefaults: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  }
}
