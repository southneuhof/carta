import { describe, expect, it } from 'vitest'
import { activeNavigationModule, navigation, visibleNavigation } from '../navigation'

describe('navigation entrypoints', () => {
  it('keeps ordered resource and direct entrypoints only', () => {
    expect(navigation.map((module) => module.name)).toEqual(['dashboard', 'to-do', 'quality', 'settings', 'master-data'])
    expect(
      visibleNavigation(() => true)
        .flatMap((module) => module.routes)
        .some((entry) => 'to' in entry)
    ).toBe(true)
  })

  it('guards the ITP entry with the existing project read grant', () => {
    const quality = navigation.find((module) => module.name === 'quality')!
    expect(quality.routes).toContainEqual({ to: { name: 'quality-inspection-test-plans' }, permission: 'view-projects', title: 'Inspection & Test Plan', icon: 'folder' })
  })

  it('adds the Work Permit entry with its system view grant', () => {
    const masterData = navigation.find((module) => module.name === 'master-data')!
    expect(masterData.routes).toContainEqual({ separator: 'Work Permit' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-permit-work-types' }, permission: 'view-permit-work-types', title: 'Tipe Pekerjaan', icon: 'folder' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-permit-danger-source' }, permission: 'view-permit-danger-source', title: 'Sumber Bahaya', icon: 'folder' })
  })

  it('matches entrypoint subtrees at segment boundaries and prefers longest target', () => {
    const paths: Record<string, string> = {
      dashboard: '/dashboard',
      'to-do': '/to-do',
      'settings-users': '/settings/users',
      'settings-roles': '/settings/roles',
    }
    const resolve = (to: unknown) => ({ path: paths[(to as { name: string }).name] ?? '/' })

    expect(activeNavigationModule('/settings/roles/7/detail', resolve, () => true)).toBe('settings')
    expect(activeNavigationModule('/settings/role', resolve, () => true)).toBeUndefined()
  })

  it('keeps only open menus visible without grants', () => {
    const visible = visibleNavigation(() => false)
    const routes = visible.flatMap((module) => module.routes).filter((entry) => !('separator' in entry)).map((entry) => entry.name)

    expect(routes).toEqual(['dashboard', 'to-do'])
  })
})
