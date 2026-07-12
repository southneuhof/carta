import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  hasPermission: vi.fn(),
  manifest: [
    { name: 'dashboard', routes: [{ name: 'dashboard' }] },
    { name: 'settings', routes: [{ separator: true, name: 'System' }, { name: 'users' }] },
  ] as any,
}))

vi.mock('@/components/navigations/navigation-manifest', () => ({ default: mocks.manifest }))
vi.mock('@/stores/permissions', () => ({ permissions: () => ({ has: mocks.hasPermission }) }))

import { getDefaultAuthenticatedRouteLocation, getFirstAccessibleRouteName, resolvePostLoginRoute } from '../navigation'

describe('navigation helpers', () => {
  beforeEach(() => {
    mocks.hasPermission.mockReset()
    mocks.hasPermission.mockImplementation((permission: string) => permission === 'view-users' || permission === 'view-dashboard')
  })

  it('returns the first accessible route name from the manifest', () => {
    mocks.hasPermission.mockImplementation((permission: string) => permission === 'view-users')

    expect(getFirstAccessibleRouteName()).toBe('users')
    expect(getDefaultAuthenticatedRouteLocation()).toEqual({ name: 'users' })
  })

  it('returns null when no accessible route exists', () => {
    mocks.hasPermission.mockReturnValue(false)

    expect(getFirstAccessibleRouteName()).toBeNull()
    expect(getDefaultAuthenticatedRouteLocation()).toBeNull()
  })

  it('prefers stored post-login redirect and falls back when redirect is invalid', () => {
    mocks.hasPermission.mockImplementation((permission: string) => permission === 'view-dashboard')

    const router = {
      resolve: (path: string) => {
        if (path === '/settings/users') return { matched: [{}], name: 'users', path }
        if (path === '/') return { matched: [{}], name: 'root', path }
        return { matched: [], name: undefined, path }
      },
    } as any

    expect(resolvePostLoginRoute(router, '/settings/users')).toBe('/settings/users')
    expect(resolvePostLoginRoute(router, '/missing')).toEqual({ name: 'dashboard' })
    expect(resolvePostLoginRoute(router, '/')).toEqual({ name: 'dashboard' })
  })
})
