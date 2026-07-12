import type { FrameworkRuntime } from '@southneuhof/is-vue-framework'
import { frameworkBehaviors } from './adapters'

export const frameworkRuntime = {
  behaviors: frameworkBehaviors,
} satisfies FrameworkRuntime
