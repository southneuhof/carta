import type { NavigableResourceAction } from '@southneuhof/is-vue-framework'

/** Ordered child routes rendered as record-page tabs. */
export interface RouteTab {
  action: NavigableResourceAction
  label: string
}
