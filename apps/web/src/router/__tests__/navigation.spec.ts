import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  canPermission: vi.fn(),
}))

vi.mock('@/stores/permissions', () => ({ permissions: () => ({ can: mocks.canPermission }) }))

import { getDefaultAuthenticatedRouteLocation, getFirstAccessibleRouteName, resolvePostLoginRoute } from '../navigation'

describe('navigation helpers', () => {
  beforeEach(() => {
    mocks.canPermission.mockReset()
    mocks.canPermission.mockImplementation((permission: string) => permission === 'view-users' || permission === 'view-dashboard')
  })

  it('returns first manifest entrypoint, including explicit public actions', () => {
    mocks.canPermission.mockImplementation((permission: string) => permission === 'view-users')

    expect(getFirstAccessibleRouteName()).toBe('dashboard')
    expect(getDefaultAuthenticatedRouteLocation()).toEqual({ name: 'dashboard' })
  })

  it('keeps public dashboard available when no persisted grant exists', () => {
    mocks.canPermission.mockReturnValue(false)

    expect(getFirstAccessibleRouteName()).toBe('dashboard')
    expect(getDefaultAuthenticatedRouteLocation()).toEqual({ name: 'dashboard' })
  })

  it('prefers stored post-login redirect and falls back when redirect is invalid', () => {
    mocks.canPermission.mockImplementation((permission: string) => permission === 'view-dashboard')

    const router = {
      resolve: (path: string) => {
        if (path === '/settings/users') return { matched: [{}], name: 'settings-users', path }
        if (path === '/') return { matched: [{}], name: 'root', path }
        return { matched: [], name: undefined, path }
      },
    } as any

    expect(resolvePostLoginRoute(router, '/settings/users')).toBe('/settings/users')
    expect(resolvePostLoginRoute(router, '/missing')).toEqual({ name: 'dashboard' })
    expect(resolvePostLoginRoute(router, '/')).toEqual({ name: 'dashboard' })
  })
})
