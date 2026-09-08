import type { RouteLocationAsRelativeTypedList } from 'vue-router'
import type { RouteNamedMap } from 'vue-router/auto-routes'

type RouteTabTarget = {
  [Name in keyof RouteNamedMap]: Omit<RouteLocationAsRelativeTypedList<RouteNamedMap>[Name], 'name' | 'params'> & {
    name: Name
    params?: Partial<RouteNamedMap[Name]['paramsRaw']>
  }
}[keyof RouteNamedMap]

/** Ordered child routes rendered as record-page tabs. */
export interface RouteTab {
  action: { permission: string | null; to?: RouteTabTarget }
  label: string
}
