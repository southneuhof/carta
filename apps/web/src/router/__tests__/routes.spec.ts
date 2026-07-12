import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('file-based routes', () => {
  it('resolves clean named routes through their group layouts', () => {
    const users = router.resolve('/settings/users')
    expect(users.name).toBe('users')
    expect(users.matched.map((route) => route.meta.requiresAuth)).toContain(true)
    expect(router.resolve({ name: 'dashboard' }).path).toBe('/dashboard')
    expect(router.resolve({ name: 'roles' }).path).toBe('/settings/roles')
    expect(router.resolve({ name: 'login' }).path).toBe('/auth/login')
  })

  it('resolves unknown paths to the file-based catch-all', () => {
    const missing = router.resolve('/missing/deep')
    expect(missing.name).toBe('not-found')
    expect(missing.matched.length).toBeGreaterThan(0)

    const known = router.resolve('/settings/users')
    expect(known.name).toBe('users')
    expect(known.matched.some((route) => route.name === 'not-found')).toBe(false)
  })

  it('does not retain layout-prefixed legacy URLs', () => {
    expect(router.resolve('/authenticated/settings/users').name).toBe('not-found')
    expect(router.resolve('/unauthenticated/auth/login').name).toBe('not-found')
  })
})
