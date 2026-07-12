import { inject } from 'vue'
import { frameworkRuntimeKey, type FrameworkRuntime } from './runtime'

export function useFrameworkRuntime(): FrameworkRuntime {
  const runtime = inject(frameworkRuntimeKey)
  if (!runtime) throw new Error('[is-vue-framework] FrameworkPlugin is not installed.')
  return runtime
}

export function useFrameworkBehaviors() {
  return useFrameworkRuntime().behaviors
}
