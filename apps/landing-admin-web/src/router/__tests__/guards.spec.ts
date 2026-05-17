import { beforeEach, describe, expect, it, vi } from 'vitest'

const tokenState = { token: '' }
const saveRedirectSpy = vi.fn()
const getDefaultRouteSpy = vi.fn(() => ({ name: 'dashboard' }))

vi.mock('@southneuhof/utilities/storage', () => ({
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

  it('redirects root to login when unauthenticated', () => {
    const guard = createAuthGuard()
    const result = guard({ name: undefined, fullPath: '/', path: '/', matched: [] } as any, {} as any, next)

    expect(result).toEqual({ name: 'login' })
  })

  it('redirects root to first menu route when authenticated', () => {
    tokenState.token = 'abc'
    const guard = createAuthGuard()
    const result = guard({ name: undefined, fullPath: '/', path: '/', matched: [] } as any, {} as any, next)

    expect(getDefaultRouteSpy).toHaveBeenCalled()
    expect(result).toEqual({ name: 'dashboard' })
  })

  it('redirects protected route to login when unauthenticated', () => {
    const guard = createAuthGuard()
    const result = guard(
      { name: 'website', fullPath: '/authenticated/website/website', path: '/authenticated/website/website', matched: [{}] } as any,
      {} as any,
      next,
    )

    expect(saveRedirectSpy).toHaveBeenCalledWith('/authenticated/website/website')
    expect(result).toEqual({ name: 'login' })
  })

  it('redirects login to first menu route when already authenticated', () => {
    tokenState.token = 'abc'
    const guard = createAuthGuard()
    const result = guard(
      { name: 'login', fullPath: '/unauthenticated/auth/login', path: '/unauthenticated/auth/login', matched: [{}] } as any,
      {} as any,
      next,
    )

    expect(result).toEqual({ name: 'dashboard' })
  })

  it('falls through to not-found for unmatched route when authenticated', () => {
    tokenState.token = 'abc'
    const guard = createAuthGuard()
    const result = guard({ name: undefined, fullPath: '/missing', path: '/missing', matched: [] } as any, {} as any, next)

    expect(result).toEqual({ name: 'not-found' })
  })
})
