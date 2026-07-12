import app from '@/configs/app'
import { storage } from '@southneuhof/utilities/storage'
import { savePostLoginRedirect } from '@/utils/post-login-redirect'
import { getDefaultAuthenticatedRouteLocation } from './navigation'
import type { NavigationGuard } from 'vue-router'

export function isPublicRoute(routeName: unknown): boolean {
  return app.unprotectedRoutes.includes(String(routeName))
}

export function createAuthGuard(): NavigationGuard {
  return (to) => {
    const authenticated = Boolean(storage.localStorage.get('profile')?.id)

    if (isPublicRoute(to.name)) {
      if (authenticated && (String(to.name) === 'login' || to.path === '/')) {
        const destination = getDefaultAuthenticatedRouteLocation()
        if (destination) return destination
      }
      return true
    }

    if (!authenticated) {
      savePostLoginRedirect(to.fullPath)
      return { name: 'login' }
    }

    if (to.path === '/') {
      return getDefaultAuthenticatedRouteLocation() ?? true
    }

    if (!to.matched.length) {
      return { name: 'not-found' }
    }

    return true
  }
}
