import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('mechanical file routes', () => {
  it('marks generated authenticated routes and leaves public routes unmarked', () => {
    expect(router.resolve('/dashboard').meta.requiresAuth).toBe(true)
    expect(router.resolve('/settings/users').meta.requiresAuth).toBe(true)
    expect(router.resolve('/auth/login').meta.requiresAuth).not.toBe(true)
  })

  it('uses static segment names and detail parents', () => {
    expect(router.resolve({ name: 'settings-roles' }).path).toBe('/settings/roles')
    expect(router.resolve('/settings/roles/7/detail').name).toBe('settings-roles-detail')
    expect(router.resolve('/settings/roles/7/detail/permissions').name).toBe('settings-roles-detail-permissions')
    expect(router.resolve('/settings/permissions').name).toBe('settings-permissions')
    expect(router.resolve('/settings/permissions/7/detail').name).toBe('settings-permissions-detail')
    expect(router.resolve('/settings/users/7/detail/role-assignments').name).toBe('settings-users-detail-role-assignments')
  })

  it('rejects removed bare detail URLs', () => {
    expect(router.resolve('/settings/roles/7').name).toBe('not-found')
    expect(router.resolve('/settings/users/7/roles').name).toBe('not-found')
    expect(router.resolve('/settings/role-groups').name).toBe('not-found')
    expect(router.resolve('/settings/permissions/create').name).toBe('not-found')
    expect(router.resolve('/settings/permissions/7/edit').name).toBe('not-found')
    expect(router.resolve('/master-data/projects').name).toBe('not-found')
    expect(router.resolve('/notifications').name).toBe('not-found')
  })
})
