export interface RegisteredResourceAction {
  resourceKey: string
  action: string
  permission: string | null
}

const actionsByRoute = new Map<string, RegisteredResourceAction>()

export function registerResourceAction(routeName: string, action: RegisteredResourceAction): void {
  const existing = actionsByRoute.get(routeName)
  if (!existing) {
    actionsByRoute.set(routeName, action)
    return
  }
  if (existing.resourceKey === action.resourceKey && existing.action === action.action && existing.permission === action.permission) return
  throw new Error(`[is-vue-framework] Route action conflict for "${routeName}".`)
}

export function resourceActionForRoute(routeName: string): RegisteredResourceAction | undefined {
  return actionsByRoute.get(routeName)
}

export function resetResourceActionRegistry(): void {
  actionsByRoute.clear()
}
