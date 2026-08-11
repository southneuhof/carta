import type { Router } from 'vue-router'
import type { AccessAdapter, FrameworkAdaptersInput, ResourceOperation } from '@southneuhof/is-vue-framework'
import { dataAdapter } from './data/normalize'
import { createRouteQueryAdapter } from './query/routeQuery'
import { permissions } from '@/stores/permissions'

const legacyPermissionPrefix: Record<ResourceOperation, string> = {
  list: 'view',
  detail: 'show',
  create: 'create',
  update: 'update',
  delete: 'delete',
}

/** Uses server operations for project records and memory permissions elsewhere. */
export const accessAdapter: AccessAdapter = {
  allows: ({ operation, permission, record }) => {
    const allowedOperations = record?.allowedOperations
    if (['detail', 'update', 'delete'].includes(operation) && Array.isArray(allowedOperations)) {
      return allowedOperations.includes(operation)
    }
    return allowsPermission(permission)
  },
}

/** Maps a canonical action permission to the server-provided system grant. */
export function allowsPermission(permission: string | null | undefined): boolean {
  if (!permission) return true
  const match = permission.match(/^(.*)\.(list|detail|create|update|delete)$/)
  if (!match) return permissions().has(permission)
  return permissions().has(`${legacyPermissionPrefix[match[2] as ResourceOperation]}-${match[1]}`)
}

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
    access: accessAdapter,
    query: createRouteQueryAdapter(router),
    queryDefaults: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  }
}
