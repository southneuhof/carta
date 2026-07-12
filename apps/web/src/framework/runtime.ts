import type { FrameworkRuntime } from '@southneuhof/is-vue-framework'
import { frameworkRuntimeCapabilities } from './adapters'

export const frameworkRuntime = {
  ...frameworkRuntimeCapabilities,
} satisfies FrameworkRuntime
