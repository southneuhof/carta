import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { createAuthGuard } from '../guards'

const next = (() => {}) as any

describe('createAuthGuard', () => {
  beforeEach(() => {
    authState.profile = null
    saveRedirectSpy.mockReset()
    getDefaultRouteSpy.mockClear()
    getDefaultRouteSpy.mockReturnValue({ name: 'dashboard' })
  })

  it('allows public login route without a profile', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'login', fullPath: '/unauthenticated/auth/login', path: '/unauthenticated/auth/login', matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })

  it('does not redirect authenticated login to itself without an accessible destination', () => {
    authState.profile = { id: 'user-1' }
    getDefaultRouteSpy.mockReturnValue(null as any)
    const guard = createAuthGuard()
    const result = guard({ name: 'login', fullPath: '/unauthenticated/auth/login', path: '/unauthenticated/auth/login', matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })

  it('redirects protected route without a profile and saves redirect', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'users', fullPath: '/authenticated/settings/users', path: '/authenticated/settings/users', matched: [{}] } as any, {} as any, next)

    expect(saveRedirectSpy).toHaveBeenCalledWith('/authenticated/settings/users')
    expect(result).toEqual({ name: 'login' })
  })

  it('redirects root route with a profile to first accessible route', () => {
    authState.profile = { id: 'user-1' }
    const guard = createAuthGuard()
    const result = guard({ name: undefined, fullPath: '/', path: '/', matched: [] } as any, {} as any, next)

    expect(getDefaultRouteSpy).toHaveBeenCalled()
    expect(result).toEqual({ name: 'dashboard' })
  })

  it('redirects unknown route without a profile to login', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'not-found', fullPath: '/missing', path: '/missing', matched: [{}] } as any, {} as any, next)

    expect(result).toEqual({ name: 'login' })
  })

  it('allows unknown route with a profile without signing out', () => {
    authState.profile = { id: 'user-1' }
    const guard = createAuthGuard()
    const result = guard({ name: 'not-found', fullPath: '/missing', path: '/missing', matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })
})
