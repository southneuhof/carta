import { beforeEach, describe, expect, it, vi } from 'vitest'

const moduleState = { value: [] as any[] }

vi.mock('@/stores/modules', () => ({
  modules: () => moduleState,
}))

import { getDefaultAuthenticatedRouteLocation, getFirstAccessibleRouteName, resolvePostLoginRoute } from '../navigation'

describe('navigation helpers', () => {
  beforeEach(() => {
    moduleState.value = []
  })

  it('returns the first non-separator route name from modules store', () => {
    moduleState.value = [
      {
        routes: [
          { separator: true, name: 'System' },
          { name: 'users' },
        ],
      },
    ]

    expect(getFirstAccessibleRouteName()).toBe('users')
    expect(getDefaultAuthenticatedRouteLocation()).toEqual({ name: 'users' })
  })

  it('returns null when no accessible route exists', () => {
    moduleState.value = [{ routes: [{ separator: true, name: 'System' }] }]

    expect(getFirstAccessibleRouteName()).toBeNull()
    expect(getDefaultAuthenticatedRouteLocation()).toBeNull()
  })

  it('prefers stored post-login redirect and falls back when redirect is invalid', () => {
    moduleState.value = [{ routes: [{ name: 'dashboard' }] }]

    const router = {
      resolve: (path: string) => (path === '/authenticated/settings/users' ? { matched: [{}], name: 'users' } : { matched: [], name: undefined }),
    } as any

    expect(resolvePostLoginRoute(router, '/authenticated/settings/users')).toBe('/authenticated/settings/users')
    expect(resolvePostLoginRoute(router, '/missing')).toEqual({ name: 'dashboard' })
    expect(resolvePostLoginRoute(router, '/settings/users')).toEqual({ name: 'dashboard' })
  })
})
