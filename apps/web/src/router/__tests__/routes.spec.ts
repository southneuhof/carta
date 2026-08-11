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
    expect(router.resolve('/settings/users/7/detail/system-roles').name).toBe('settings-users-detail-system-roles')
    expect(router.resolve('/settings/users/7/detail/project-roles').name).toBe('settings-users-detail-project-roles')
    const projectVendors = router.resolve('/master-data/projects/7/detail/vendors')
    expect(projectVendors.name).toBe('master-data-projects-detail-vendors')
    expect(projectVendors.matched.map((record) => record.name)).toContain('master-data-projects-detail')
    expect(router.resolve('/master-data/projects/7/detail/vendors/create').name).toBe('master-data-projects-detail-vendors-create')
    expect(router.resolve('/master-data/projects/7/detail/vendors/vendor-1/detail').name).toBe('master-data-projects-detail-vendors-detail')
    expect(router.resolve('/master-data/projects/7/detail/vendors/vendor-1/edit').name).toBe('master-data-projects-detail-vendors-edit')
    expect(router.resolve('/notifications').name).toBe('notifications')
  })

  it('rejects removed bare detail URLs', () => {
    expect(router.resolve('/settings/roles/7').name).toBe('not-found')
    expect(router.resolve('/settings/users/7/roles').name).toBe('not-found')
    const retiredRoleGroups = ['role', 'groups'].join('-')
    expect(router.resolve('/settings/' + retiredRoleGroups).name).toBe('not-found')
    expect(router.resolve('/settings/permissions/create').name).toBe('not-found')
    expect(router.resolve('/settings/permissions/7/edit').name).toBe('not-found')
    expect(router.resolve('/master-data/projects/7/vendors').name).toBe('not-found')
    expect(router.resolve('/master-data/project-vendors').name).toBe('not-found')
  })
})
