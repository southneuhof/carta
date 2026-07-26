import type { App, Plugin } from 'vue'
import type { QueryClient } from '@tanstack/vue-query'
import { VueQueryPlugin } from '@tanstack/vue-query'
import type { FrameworkRuntime } from '../runtime'
import { frameworkRuntimeKey } from '../runtime'
import { frameworkDefaultsKey, resolveFrameworkDefaults, type FrameworkDefaultsInput } from './defaults'
import { frameworkAdaptersKey, resolveFrameworkAdapters, type FrameworkAdaptersInput } from './projectAdapters'
import { createFrameworkQueryClient, frameworkQueryClientKey } from '../query/client'

export interface FrameworkPluginOptions {
  runtime: FrameworkRuntime
  defaults?: FrameworkDefaultsInput
  /** Project-specific normalization, query location, and schema lookup. */
  adapters?: FrameworkAdaptersInput
  /** Injected cache client for tests and advanced projects. */
  queryClient?: QueryClient
}

function isPluginOptions(value: FrameworkRuntime | FrameworkPluginOptions): value is FrameworkPluginOptions {
  return Object.prototype.hasOwnProperty.call(value, 'runtime')
}

export const FrameworkPlugin: Plugin<[runtimeOrOptions: FrameworkRuntime | FrameworkPluginOptions]> = {
  install(app: App, runtimeOrOptions: FrameworkRuntime | FrameworkPluginOptions) {
    if (!runtimeOrOptions || typeof runtimeOrOptions !== 'object') {
      throw new Error('[vue-framework] FrameworkPlugin requires a runtime object.')
    }

    const runtime = isPluginOptions(runtimeOrOptions) ? runtimeOrOptions.runtime : runtimeOrOptions
    if (!runtime || typeof runtime !== 'object') {
      throw new Error('[vue-framework] FrameworkPlugin requires a runtime object.')
    }
    const options = isPluginOptions(runtimeOrOptions) ? runtimeOrOptions : undefined
    app.provide(frameworkRuntimeKey, runtime)
    app.provide(frameworkDefaultsKey, resolveFrameworkDefaults(options?.defaults))

    const adapters = resolveFrameworkAdapters(options?.adapters)
    app.provide(frameworkAdaptersKey, adapters)

    const queryClient = options?.queryClient ?? createFrameworkQueryClient(adapters.queryDefaults)
    app.provide(frameworkQueryClientKey, queryClient)
    app.use(VueQueryPlugin, { queryClient })
  },
}
