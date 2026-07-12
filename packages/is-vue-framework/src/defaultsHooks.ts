import { inject } from 'vue'
import { frameworkDefaultsKey, type ResolvedFrameworkDefaults } from './adapters/defaults'

export function useFrameworkDefaults(): ResolvedFrameworkDefaults {
  const defaults = inject(frameworkDefaultsKey)
  if (!defaults) throw new Error('[is-vue-framework] FrameworkPlugin is not installed.')
  return defaults
}
