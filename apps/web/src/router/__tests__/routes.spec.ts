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

describe('roles route tree', () => {
  it('produces one route per roles screen', () => {
    expect(router.resolve('/settings/roles').name).toBe('roles')
    expect(router.resolve('/settings/roles/new').name).toBe('roles-create')
    expect(router.resolve('/settings/roles/7').name).toBe('roles-detail')
    expect(router.resolve('/settings/roles/7/edit').name).toBe('roles-update')
    expect(router.resolve('/settings/roles/7/permissions').name).toBe('roles-permissions')
  })

  it('passes the role identity as a route param', () => {
    expect(router.resolve('/settings/roles/7/permissions').params).toEqual({ roleId: '7' })
  })

  it('nests the record screens under a shared role layout', () => {
    const detail = router.resolve('/settings/roles/7')
    const permissions = router.resolve('/settings/roles/7/permissions')
    const shared = detail.matched.filter((route) => permissions.matched.includes(route))

    expect(shared.some((route) => route.path.includes(':roleId'))).toBe(true)
    expect(router.resolve('/settings/roles').matched.some((route) => route.path.includes(':roleId'))).toBe(false)
  })

  it('lazily loads every roles screen component', () => {
    for (const path of ['/settings/roles', '/settings/roles/new', '/settings/roles/7', '/settings/roles/7/edit', '/settings/roles/7/permissions']) {
      const record = router.resolve(path).matched.at(-1)!
      expect(typeof record.components?.default).toBe('function')
    }
  })
})

describe('users route tree', () => {
  it('produces one route per users screen', () => {
    expect(router.resolve('/settings/users').name).toBe('users')
    expect(router.resolve('/settings/users/7').name).toBe('users-detail')
    expect(router.resolve('/settings/users/7/edit').name).toBe('users-update')
    expect(router.resolve('/settings/users/7/roles').name).toBe('users-roles')
  })

  it('passes the user identity as a route param under a shared layout', () => {
    const detail = router.resolve('/settings/users/7')
    const mapping = router.resolve('/settings/users/7/roles')

    expect(mapping.params).toEqual({ userId: '7' })
    expect(detail.matched.filter((route) => mapping.matched.includes(route)).some((route) => route.path.includes(':userId'))).toBe(true)
  })

  it('offers no create route, matching the backend capability', () => {
    expect(router.resolve('/settings/users/new').name).toBe('users-detail')
  })
})
