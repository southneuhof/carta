import type { RouteLocationRaw, Router } from 'vue-router'
import { modules } from '@/stores/modules'

type AccessibleRoute = {
  separator?: boolean
  name?: string
}

export function getFirstAccessibleRouteName(): string | null {
  for (const module of modules().value) {
    const firstRoute = module.routes.find((route) => !(route as AccessibleRoute).separator) as AccessibleRoute | undefined
    if (firstRoute?.name) {
      return firstRoute.name
    }
  }

  return null
}

export function getDefaultAuthenticatedRouteLocation(): RouteLocationRaw | null {
  const routeName = getFirstAccessibleRouteName()
  return routeName ? { name: routeName } : null
}

export function resolvePostLoginRoute(router: Router, redirect: string | null): RouteLocationRaw | null {
  if (redirect) {
    const resolved = router.resolve(redirect)
    if (resolved.matched.length && resolved.name !== 'login') {
      return redirect
    }
  }

  return getDefaultAuthenticatedRouteLocation()
}
