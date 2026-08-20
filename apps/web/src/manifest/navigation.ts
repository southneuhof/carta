import { defineNavigation, type NavigationIcon, type NavigationModule } from './contract'

export const navigation = defineNavigation([
  { name: 'dashboard', title: 'Dashboard', icon: 'home', description: 'Dashboard', routes: [{ to: { name: 'dashboard' }, permission: null, title: 'Dashboard', icon: 'home' }] },
  { name: 'to-do', title: 'To Do', icon: 'inbox', description: 'Task inbox', routes: [{ to: { name: 'to-do' }, permission: null, title: 'To Do', icon: 'inbox' }] },
  {
    name: 'quality',
    title: 'Quality',
    icon: 'folder',
    description: 'Quality workflows',
    routes: [
      { to: { name: 'quality-pts' }, permission: 'view-qhsse-pts', title: 'PTS', icon: 'folder' },
      { to: { name: 'quality-inspection-test-plans' }, permission: 'view-projects', title: 'Inspection & Test Plan', icon: 'folder' },
      { to: { name: 'quality-quality-inspection' }, permission: 'view-quality-inspection', title: 'Inspection/Test', icon: 'folder' },
    ],
  },
  {
    name: 'orientation',
    title: 'Orientation',
    icon: 'folder',
    description: 'Orientation',
    routes: [
      { separator: 'QHSSE Orientation' },
      { to: { name: 'orientation-syllabus' }, permission: 'view-syllabus', title: 'Silabus', icon: 'folder' },
      { to: { name: 'orientation-syllabus-categories' }, permission: 'view-syllabus-categories', title: 'Kategori Silabus', icon: 'folder' },
      { to: { name: 'orientation-learning-materials' }, permission: 'view-learning-materials', title: 'Materi', icon: 'folder' },
    ],
  },
  {
    name: 'settings',
    title: 'Pengaturan',
    icon: 'settings',
    description: 'Pengaturan',
    routes: [
      { separator: 'System' },
      { to: { name: 'settings-users' }, permission: 'view-users', title: 'Users', icon: 'folder' },
      { to: { name: 'settings-roles' }, permission: 'view-roles', title: 'Roles', icon: 'folder' },
      { to: { name: 'settings-permissions' }, permission: 'view-permissions', title: 'Permissions', icon: 'folder' },
    ],
  },
  {
    name: 'master-data',
    title: 'Master Data',
    icon: 'folder',
    description: 'PTS master data',
    routes: [
      { to: { name: 'master-data-business-categories' }, permission: 'view-business-categories', title: 'Kategori Bisnis', icon: 'folder' },
      { to: { name: 'master-data-divisions' }, permission: 'view-divisions', title: 'Divisi', icon: 'folder' },
      { to: { name: 'master-data-projects' }, permission: 'view-projects', title: 'Proyek', icon: 'folder' },
      { to: { name: 'master-data-uoms' }, permission: 'view-uoms', title: 'Satuan', icon: 'folder' },
      { to: { name: 'master-data-work-items' }, permission: 'view-work-items', title: 'Jenis Pekerjaan', icon: 'folder' },
      { to: { name: 'master-data-pts-work-categories' }, permission: 'view-pts-work-categories', title: 'Kategori Pekerjaan', icon: 'folder' },
      { to: { name: 'master-data-root-causes' }, permission: 'view-root-causes', title: 'Penyebab QHSSE', icon: 'folder' },
      { to: { name: 'master-data-number-configs' }, permission: 'view-number-configs', title: 'Number Configurations', icon: 'folder' },
      { separator: 'Data' },
      { to: { name: 'master-data-tools-types' }, permission: 'view-tools-types', title: 'Jenis Alat Berat & Alat Ukur/Uji', icon: 'folder' },
      { to: { name: 'master-data-tools-brands' }, permission: 'view-tools-brands', title: 'Merk Alat Berat & Alat Ukur/Uji', icon: 'folder' },
      { separator: 'Emergency Simulation' },
      { to: { name: 'master-data-emergency-simulation-topics' }, permission: 'view-emergency-simulation-topics', title: 'Topik Simulasi Tanggap Darurat', icon: 'folder' },
      { to: { name: 'master-data-emergency-simulation-employees' }, permission: 'view-emergency-simulation-employees', title: 'Karyawan Terlibat', icon: 'folder' },
      { to: { name: 'master-data-emergency-simulation-tools' }, permission: 'view-emergency-simulation-tools', title: 'Perlengkapan Tanggap Darurat', icon: 'folder' },
      { separator: 'HSSE' },
      { to: { name: 'master-data-hsse-observation' }, permission: 'view-hsse-observation', title: 'Kriteria Temuan Observation', icon: 'folder' },
      { to: { name: 'master-data-incident-statement-document-configs' }, permission: 'view-incident-statement-document-configs', title: 'Dokumen Pernyataan Insiden', icon: 'folder' },
      { separator: 'Undang-Undang' },
      { to: { name: 'master-data-law-reference-items' }, permission: 'view-law-reference-items', title: 'Regulasi & Perundangan HSSE', icon: 'folder' },
      { separator: 'Work Permit' },
      { to: { name: 'master-data-permit-work-types' }, permission: 'view-permit-work-types', title: 'Tipe Pekerjaan', icon: 'folder' },
      { to: { name: 'master-data-permit-danger-source' }, permission: 'view-permit-danger-source', title: 'Sumber Bahaya', icon: 'folder' },
      { to: { name: 'master-data-permit-attachment' }, permission: 'view-permit-attachment', title: 'Checklist Dokumen', icon: 'folder' },
      { to: { name: 'master-data-safety-checklist' }, permission: 'view-safety-checklist', title: 'Safety Checklist', icon: 'folder' },
      { to: { name: 'master-data-permit-category-apd' }, permission: 'view-permit-category-apd', title: 'APD', icon: 'folder' },
      { separator: 'Road Traffic Safety' },
      { to: { name: 'master-data-toll-causes-accidents' }, permission: 'view-toll-causes-accidents', title: 'Faktor Kecelakaan', icon: 'folder' },
    ],
  },
] as const satisfies readonly NavigationModule[])

export type VisibleNavigationRoute = { name: string; to: unknown; title: string; icon: NavigationIcon }
export type VisibleNavigationEntry = { separator: true; name: string } | VisibleNavigationRoute
export type VisibleNavigationModule = Omit<(typeof navigation)[number], 'routes'> & { routes: VisibleNavigationEntry[] }

export function visibleNavigation(allows: (permission: string) => boolean): VisibleNavigationModule[] {
  return navigation.flatMap((module) => {
    const routes: VisibleNavigationEntry[] = []
    for (const entry of module.routes) {
      if ('separator' in entry) {
        if (routes.length && !('separator' in routes.at(-1)!)) routes.push({ separator: true, name: entry.separator })
        continue
      }
      if (!('to' in entry)) continue
      const permission = entry.permission
      if (permission !== null && !allows(permission)) continue
      const to = entry.to
      if (!to || typeof to === 'function') continue
      routes.push({ name: (to as { name: string }).name, to, title: entry.title, icon: entry.icon })
    }
    if (routes.at(-1) && 'separator' in routes.at(-1)!) routes.pop()
    return routes.length ? [{ ...module, routes }] : []
  })
}

export function matchesNavigationPath(path: string, entryPath: string) {
  return path === entryPath || path.startsWith(`${entryPath}/`)
}

/** Finds entrypoint module owning path, by segment boundary then longest match. */
export function activeNavigationModule(path: string, resolve: (to: unknown) => { path: string }, allows: (permission: string) => boolean): string | undefined {
  const candidates = visibleNavigation(allows).flatMap((module, index) =>
    module.routes.flatMap((route) => {
      if ('separator' in route) return []
      const entryPath = resolve(route.to).path
      return matchesNavigationPath(path, entryPath) ? [{ name: module.name, pathLength: entryPath.length, index }] : []
    })
  )
  return candidates.sort((left, right) => right.pathLength - left.pathLength || left.index - right.index)[0]?.name
}
