import type { FrameworkRuntime } from '@southneuhof/is-vue-framework'
import * as table from './table'
import * as detail from './detail'

export const frameworkRuntimeCapabilities = {
  table,
  detail,
} satisfies FrameworkRuntime
