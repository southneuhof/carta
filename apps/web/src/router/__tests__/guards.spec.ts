import { beforeEach, describe, expect, it, vi } from 'vitest'

const tokenState = { token: '' }
const saveRedirectSpy = vi.fn()
const getDefaultRouteSpy = vi.fn(() => ({ name: 'dashboard' }))

vi.mock('@/utils/storage', () => ({
  storage: {
    cookie: {
      get: () => tokenState.token,
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
    tokenState.token = ''
    saveRedirectSpy.mockReset()
    getDefaultRouteSpy.mockClear()
    getDefaultRouteSpy.mockReturnValue({ name: 'dashboard' })
  })

  it('allows public login route without token', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'login', fullPath: '/unauthenticated/auth/login', path: '/unauthenticated/auth/login', matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })

  it('redirects protected route without token and saves redirect', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'users', fullPath: '/authenticated/settings/users', path: '/authenticated/settings/users', matched: [{}] } as any, {} as any, next)

    expect(saveRedirectSpy).toHaveBeenCalledWith('/authenticated/settings/users')
    expect(result).toEqual({ name: 'login' })
  })

  it('redirects root route with token to first accessible route', () => {
    tokenState.token = 'abc'
    const guard = createAuthGuard()
    const result = guard({ name: undefined, fullPath: '/', path: '/', matched: [] } as any, {} as any, next)

    expect(getDefaultRouteSpy).toHaveBeenCalled()
    expect(result).toEqual({ name: 'dashboard' })
  })

  it('redirects unknown route without token to login', () => {
    const guard = createAuthGuard()
    const result = guard({ name: 'not-found', fullPath: '/missing', path: '/missing', matched: [{}] } as any, {} as any, next)

    expect(result).toEqual({ name: 'login' })
  })

  it('allows unknown route with token without signing out', () => {
    tokenState.token = 'abc'
    const guard = createAuthGuard()
    const result = guard({ name: 'not-found', fullPath: '/missing', path: '/missing', matched: [{}] } as any, {} as any, next)

    expect(result).toBe(true)
  })
})
