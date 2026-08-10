import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({ history: createMemoryHistory(), routes })

describe('mechanical file routes', () => {
  it('uses static segment names and detail parents', () => {
    expect(router.resolve({ name: 'settings-roles' }).path).toBe('/settings/roles')
    expect(router.resolve('/settings/roles/7/detail').name).toBe('settings-roles-detail')
    expect(router.resolve('/settings/roles/7/detail/permissions').name).toBe('settings-roles-detail-permissions')
    expect(router.resolve('/settings/users/7/detail/roles').name).toBe('settings-users-detail-roles')
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
    expect(router.resolve('/master-data/projects/7/vendors').name).toBe('not-found')
    expect(router.resolve('/master-data/project-vendors').name).toBe('not-found')
  })
})
