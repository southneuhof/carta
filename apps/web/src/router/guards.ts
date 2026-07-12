import { storage } from '@southneuhof/utilities/storage'
import { savePostLoginRedirect } from '@/utils/post-login-redirect'
import { getDefaultAuthenticatedRouteLocation } from './navigation'
import type { NavigationGuard } from 'vue-router'

export function createAuthGuard(): NavigationGuard {
  return (to) => {
    const authenticated = Boolean(storage.localStorage.get('profile')?.id)

    if (to.path === '/') {
      if (!authenticated) return { name: 'login' }
      return getDefaultAuthenticatedRouteLocation() ?? true
    }

    if (authenticated && to.name === 'login') {
      return getDefaultAuthenticatedRouteLocation() ?? true
    }

    if (to.meta.requiresAuth && !authenticated) {
      savePostLoginRedirect(to.fullPath)
      return { name: 'login' }
    }

    return true
  }
}
