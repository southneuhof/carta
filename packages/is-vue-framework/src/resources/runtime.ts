/**
 * Resource runtime access.
 *
 * Resource definitions are module constants, but the adapters, cache client,
 * and access policy belong to a Vue app. Inside a component the runtime comes
 * from injection; outside one — a custom workflow invalidating after an
 * `await`, for example — it comes from the last installed app.
 */
import { getCurrentInstance, inject } from 'vue'
import type { QueryClient } from '@tanstack/vue-query'
import { frameworkAdaptersKey, resolveFrameworkAdapters, type ResolvedFrameworkAdapters } from '../adapters/projectAdapters'
import { createFrameworkQueryClient, frameworkQueryClientKey } from '../query/client'
import {
  frameworkFieldDefaultsKey,
  resolveFrameworkFieldDefaults,
  type ResolvedFrameworkFieldDefaults,
} from '../fields/defaults'

export interface ResourceRuntime {
  adapters: ResolvedFrameworkAdapters
  queryClient: QueryClient
  fieldDefaults: ResolvedFrameworkFieldDefaults
}

let installed: ResourceRuntime | undefined

export function registerResourceRuntime(runtime: ResourceRuntime): void {
  installed = runtime
}

export function resetResourceRuntimeForTests(): void {
  installed = undefined
}

export function useResourceRuntime(): ResourceRuntime {
  if (getCurrentInstance()) {
    const adapters = inject(frameworkAdaptersKey, null)
    const queryClient = inject(frameworkQueryClientKey, null)
    const fieldDefaults = inject(frameworkFieldDefaultsKey, null)
    if (adapters && queryClient && fieldDefaults) return { adapters, queryClient, fieldDefaults }
  }
  if (installed) return installed
  return {
    adapters: resolveFrameworkAdapters(),
    queryClient: createFrameworkQueryClient(),
    fieldDefaults: resolveFrameworkFieldDefaults(),
  }
}
