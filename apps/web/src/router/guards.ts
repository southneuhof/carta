import { storage } from '@southneuhof/utilities/storage'
import { savePostLoginRedirect } from '@/utils/post-login-redirect'
import { getDefaultAuthenticatedRouteLocation } from './navigation'
import { resourceCapabilityForRoute, useResourceRuntime, type AccessAdapter } from '@southneuhof/is-vue-framework'
import type { NavigationGuard } from 'vue-router'

function allowsExtraordinaryRoute(meta: { permission?: string }, access: AccessAdapter): boolean {
  return !meta.permission || access.allows({ operation: 'detail', permission: meta.permission })
}

/** Enforces ordinary route permission metadata on direct URL entry. */
export function createPermissionGuard(access?: AccessAdapter): NavigationGuard {
  return (to) => {
    const adapter = access ?? useResourceRuntime().adapters.access
    const capability = typeof to.name === 'string' ? resourceCapabilityForRoute(to.name) : undefined
    const allowed = capability
      ? capability.permission === null || adapter.allows({ operation: 'detail', permission: capability.permission })
      : allowsExtraordinaryRoute(to.meta, adapter)
    return allowed ? true : (getDefaultAuthenticatedRouteLocation() ?? { path: '/' }) as never
  }
}

export function createAuthGuard(): NavigationGuard {
  return (to) => {
    const authenticated = Boolean(storage.localStorage.get('profile')?.id)

    if (to.path === '/') {
      if (!authenticated) return { name: 'auth-login' } as never
      return getDefaultAuthenticatedRouteLocation() ?? true
    }

    if (authenticated && to.name === 'auth-login') {
      return getDefaultAuthenticatedRouteLocation() ?? true
    }

    if (to.meta.requiresAuth && !authenticated) {
      savePostLoginRedirect(to.fullPath)
      return { name: 'auth-login' } as never
    }

    return true
  }
}
