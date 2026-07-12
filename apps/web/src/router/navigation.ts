import type { RouteLocationRaw, Router } from 'vue-router'
import navigationManifest from '@/components/navigations/navigation-manifest'
import { permissions } from '@/stores/permissions'

type AccessibleRoute = {
  separator?: boolean
  name?: string
}

export function getFirstAccessibleRouteName(): string | null {
  const access = permissions()

  for (const module of navigationManifest) {
    for (const route of module.routes as AccessibleRoute[]) {
      if (!route.separator && route.name && access.has(`view-${(route as any).permission || route.name}`)) {
        return route.name
      }
    }
  }

  return null
}

export function getDefaultAuthenticatedRouteLocation(): RouteLocationRaw | null {
  const routeName = getFirstAccessibleRouteName()
  return routeName ? ({ name: routeName } as RouteLocationRaw) : null
}

export function resolvePostLoginRoute(router: Router, redirect: string | null): RouteLocationRaw | null {
  if (redirect) {
    const resolved = router.resolve(redirect)
    if (resolved.matched.length && resolved.name !== 'login' && resolved.path !== '/') {
      return redirect
    }
  }

  return getDefaultAuthenticatedRouteLocation()
}
