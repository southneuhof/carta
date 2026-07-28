import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineResource, resetResourceCapabilityRegistry } from '@southneuhof/is-vue-framework'
import { createMemoryHistory, createRouter } from 'vue-router'

const authState = { profile: null as null | { id: string } }
const saveRedirectSpy = vi.fn()
const getDefaultRouteSpy = vi.fn(() => ({ name: 'dashboard' }))

vi.mock('@southneuhof/utilities/storage', () => ({
  storage: {
    localStorage: {
      get: () => authState.profile,
    },
  },
}))

vi.mock('@/utils/post-login-redirect', () => ({
  savePostLoginRedirect: (path: string) => saveRedirectSpy(path),
}))

vi.mock('../navigation', () => ({
  getDefaultAuthenticatedRouteLocation: () => getDefaultRouteSpy(),
}))

import { createAuthGuard, createPermissionGuard } from '../guards'

const next = (() => {}) as any

afterEach(() => resetResourceCapabilityRegistry())

describe('createAuthGuard', () => {
  beforeEach(() => {
    authState.profile = null
    saveRedirectSpy.mockReset()
    getDefaultRouteSpy.mockClear()
    getDefaultRouteSpy.mockReturnValue({ name: 'dashboard' })
  })

  it('allows public login route without a profile', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'auth-login', fullPath: '/auth/login', path: '/auth/login', meta: { requiresAuth: false }, matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })

  it('does not redirect authenticated login to itself without an accessible destination', () => {
    authState.profile = { id: 'user-1' }
    getDefaultRouteSpy.mockReturnValue(null as any)
    const guard = createAuthGuard()
    const result = guard({ name: 'auth-login', fullPath: '/auth/login', path: '/auth/login', meta: { requiresAuth: false }, matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })

  it('redirects protected route without a profile and saves redirect', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'users', fullPath: '/settings/users?tab=roles', path: '/settings/users', meta: { requiresAuth: true }, matched: [{}] } as any, {} as any, next)

    expect(saveRedirectSpy).toHaveBeenCalledWith('/settings/users?tab=roles')
    expect(result).toEqual({ name: 'auth-login' })
  })

  it('redirects root route with a profile to first accessible route', () => {
    authState.profile = { id: 'user-1' }
    const guard = createAuthGuard()
    const result = guard({ name: 'root', fullPath: '/', path: '/', meta: {}, matched: [{}] } as any, {} as any, next)

    expect(getDefaultRouteSpy).toHaveBeenCalled()
    expect(result).toEqual({ name: 'dashboard' })
  })

  it('redirects unknown route without a profile to login', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'not-found', fullPath: '/missing', path: '/missing', meta: {}, matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })

  it('allows unknown route with a profile without signing out', () => {
    authState.profile = { id: 'user-1' }
    const guard = createAuthGuard()
    const result = guard({ name: 'not-found', fullPath: '/missing', path: '/missing', meta: {}, matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })
})

describe('permission guard', () => {
  const allowDetail = { allows: ({ operation }: { operation: string }) => operation === 'detail' }
  const denyAll = { allows: () => false }

  beforeEach(() => {
    getDefaultRouteSpy.mockReset()
    getDefaultRouteSpy.mockReturnValue({ name: 'dashboard' })
  })

  it('uses explicit extraordinary metadata only when no resource action owns route', () => {
    const allowed = createPermissionGuard(allowDetail)({ meta: { permission: 'roles.detail' } } as any, {} as any, next)
    const denied = createPermissionGuard(denyAll)({ meta: { permission: 'roles.detail' } } as any, {} as any, next)

    expect(allowed).toBe(true)
    expect(denied).toEqual({ name: 'dashboard' })
    expect(getDefaultRouteSpy).toHaveBeenCalledOnce()
  })

  it('allows unregistered routes without explicit permission', () => {
    expect(createPermissionGuard(denyAll)({ meta: {} } as any, {} as any, next)).toBe(true)
  })

  it('discovers lazy route action before resolving direct entry', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'dashboard', component: { template: '<main>dashboard</main>' } },
        {
          path: '/detail/:id',
          name: 'lazy-detail',
          component: async () => {
            defineResource({
              key: 'lazy-roles',
              fields: { id: { label: 'ID' } },
              capabilities: { detail: { handler: async () => undefined, permission: 'roles.detail', to: { name: 'lazy-detail', params: (id) => ({ id }) } } },
            })
            return { default: { template: '<main>detail</main>' } }
          },
        },
      ],
    })
    router.beforeResolve(createPermissionGuard(denyAll))

    await router.push('/detail/7')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('falls back to root when no accessible route exists', () => {
    getDefaultRouteSpy.mockReturnValue(null as any)
    const result = createPermissionGuard(denyAll)({ meta: { permission: 'roles.detail' } } as any, {} as any, next)
    expect(result).toEqual({ path: '/' })
  })
})
