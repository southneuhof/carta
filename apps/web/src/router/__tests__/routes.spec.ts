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
    expect(router.resolve('/hr/overtimes/7/detail').name).toBe('hr-overtimes-detail')
  })

  it('rejects removed bare detail URLs', () => {
    expect(router.resolve('/settings/roles/7').name).toBe('not-found')
    expect(router.resolve('/settings/users/7/roles').name).toBe('not-found')
    expect(router.resolve('/hr/overtimes/7').name).toBe('not-found')
  })
})
