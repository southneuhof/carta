import { describe, expect, it } from 'vitest'
import { activeNavigationModule, matchesNavigationPath, navigation, visibleNavigation } from '../navigation'

describe('navigation entrypoints', () => {
  it('keeps ordered resource and direct entrypoints only', () => {
    expect(navigation.map((module) => module.name)).toEqual(['dashboard', 'to-do', 'quality', 'orientation', 'settings', 'master-data'])
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

  it('adds the Orientation entrypoints with their system view grants', () => {
    const orientation = navigation.find((module) => module.name === 'orientation')!
    expect(orientation.routes).toContainEqual({ separator: 'QHSSE Orientation' })
    expect(orientation.routes).toContainEqual({ to: { name: 'orientation-syllabus' }, permission: 'view-syllabus', title: 'Silabus', icon: 'folder' })
    expect(orientation.routes).toContainEqual({ to: { name: 'orientation-syllabus-categories' }, permission: 'view-syllabus-categories', title: 'Kategori Silabus', icon: 'folder' })
    expect(orientation.routes).toContainEqual({ to: { name: 'orientation-learning-materials' }, permission: 'view-learning-materials', title: 'Materi', icon: 'folder' })
  })

  it('adds the Work Permit entry with its system view grant', () => {
    const masterData = navigation.find((module) => module.name === 'master-data')!
    expect(masterData.routes).toContainEqual({ separator: 'Work Permit' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-permit-work-types' }, permission: 'view-permit-work-types', title: 'Tipe Pekerjaan', icon: 'folder' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-permit-danger-source' }, permission: 'view-permit-danger-source', title: 'Sumber Bahaya', icon: 'folder' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-permit-attachment' }, permission: 'view-permit-attachment', title: 'Checklist Dokumen', icon: 'folder' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-safety-checklist' }, permission: 'view-safety-checklist', title: 'Safety Checklist', icon: 'folder' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-permit-category-apd' }, permission: 'view-permit-category-apd', title: 'APD', icon: 'folder' })
    expect(masterData.routes).toContainEqual({ separator: 'Emergency Simulation' })
    expect(masterData.routes).toContainEqual({
      to: { name: 'master-data-emergency-simulation-topics' },
      permission: 'view-emergency-simulation-topics',
      title: 'Topik Simulasi Tanggap Darurat',
      icon: 'folder',
    })
    expect(masterData.routes).toContainEqual({ separator: 'HSSE' })
    expect(masterData.routes).toContainEqual({ to: { name: 'master-data-hsse-observation' }, permission: 'view-hsse-observation', title: 'Kriteria Temuan Observation', icon: 'folder' })
    expect(masterData.routes).toContainEqual({
      to: { name: 'master-data-incident-statement-document-configs' },
      permission: 'view-incident-statement-document-configs',
      title: 'Dokumen Pernyataan Insiden',
      icon: 'folder',
    })
    expect(masterData.routes).not.toContainEqual(expect.objectContaining({ to: { name: 'master-data-permit-apd' } }))
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
    expect(matchesNavigationPath('/orientation/syllabus/7/detail', '/orientation/syllabus')).toBe(true)
    expect(matchesNavigationPath('/orientation/syllabus-categories', '/orientation/syllabus')).toBe(false)
  })

  it('keeps only open menus visible without grants', () => {
    const visible = visibleNavigation(() => false)
    const routes = visible
      .flatMap((module) => module.routes)
      .filter((entry) => !('separator' in entry))
      .map((entry) => entry.name)

    expect(routes).toEqual(['dashboard', 'to-do'])
  })
})
