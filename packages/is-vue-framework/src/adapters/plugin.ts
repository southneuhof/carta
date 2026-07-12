import type { App, Plugin } from 'vue'
import type { FrameworkRuntime } from '../runtime'
import { frameworkRuntimeKey } from '../runtime'
import { frameworkDefaultsKey, resolveFrameworkDefaults, type FrameworkDefaultsInput } from './defaults'

export interface FrameworkPluginOptions {
  runtime: FrameworkRuntime
  defaults?: FrameworkDefaultsInput
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
    app.provide(frameworkRuntimeKey, runtime)
    app.provide(frameworkDefaultsKey, resolveFrameworkDefaults(isPluginOptions(runtimeOrOptions) ? runtimeOrOptions.defaults : undefined))
  },
}
