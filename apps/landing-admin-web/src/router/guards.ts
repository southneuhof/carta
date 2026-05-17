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
    const token = storage.cookie.get('token')

    if (isPublicRoute(to.name)) {
      if (token && String(to.name) === 'login') {
        return getDefaultAuthenticatedRouteLocation() ?? { name: 'login' }
      }
      return true
    }

    if (!token) {
      savePostLoginRedirect(to.fullPath)
      return { name: 'login' }
    }

    if (to.path === '/') {
      return getDefaultAuthenticatedRouteLocation() ?? { name: 'login' }
    }

    if (!to.matched.length) {
      return { name: 'not-found' }
    }

    return true
  }
}
