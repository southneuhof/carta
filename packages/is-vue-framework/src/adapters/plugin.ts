import type { App, Plugin } from 'vue'
import type { FrameworkRuntime } from '../runtime'
import { frameworkRuntimeKey } from '../runtime'

export const FrameworkPlugin: Plugin<[runtime: FrameworkRuntime]> = {
  install(app: App, runtime: FrameworkRuntime) {
    if (!runtime || !runtime.behaviors) {
      throw new Error('[vue-framework] FrameworkPlugin requires a runtime with behaviors.')
    }

    app.provide(frameworkRuntimeKey, runtime)
  },
}
