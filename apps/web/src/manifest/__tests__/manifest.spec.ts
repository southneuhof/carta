import { describe, expect, it } from 'vitest'
import { activeNavigationModule, navigation, visibleNavigation } from '../navigation'

describe('navigation entrypoints', () => {
  it('keeps ordered resource and direct entrypoints only', () => {
    expect(navigation.map((module) => module.name)).toEqual(['dashboard', 'to-do', 'settings', 'quality', 'master-data'])
    expect(
      visibleNavigation(() => true)
        .flatMap((module) => module.routes)
        .some((entry) => 'to' in entry)
    ).toBe(true)
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
})
