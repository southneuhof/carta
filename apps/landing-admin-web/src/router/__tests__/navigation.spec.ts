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

  it('returns dashboard as first accessible route for HKR menu shape', () => {
    moduleState.value = [
      {
        routes: [{ name: 'dashboard' }],
      },
      {
        routes: [{ name: 'website' }],
      },
    ]

    expect(getFirstAccessibleRouteName()).toBe('dashboard')
    expect(getDefaultAuthenticatedRouteLocation()).toEqual({ name: 'dashboard' })
  })

  it('returns null when no accessible route exists', () => {
    moduleState.value = [{ routes: [{ separator: true, name: 'System' }] }]

    expect(getFirstAccessibleRouteName()).toBeNull()
    expect(getDefaultAuthenticatedRouteLocation()).toBeNull()
  })

  it('prefers safe redirect and falls back to dashboard', () => {
    moduleState.value = [{ routes: [{ name: 'dashboard' }] }]

    const router = {
      resolve: (path: string) => (path === '/authenticated/article/article' ? { matched: [{}], name: 'article' } : { matched: [], name: undefined }),
    } as any

    expect(resolvePostLoginRoute(router, '/authenticated/article/article')).toBe('/authenticated/article/article')
    expect(resolvePostLoginRoute(router, '/missing')).toEqual({ name: 'dashboard' })
  })
})
