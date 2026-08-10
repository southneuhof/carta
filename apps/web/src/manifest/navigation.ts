import { roles } from '@/routes/(authenticated)/settings/roles/roles.resource'
import { users } from '@/routes/(authenticated)/settings/users/users.resource'
import { pts } from '@/routes/(authenticated)/quality/pts/pts.resource'
import { defineNavigation, type NavigationIcon, type NavigationModule } from './contract'

export const navigation = defineNavigation([
  { name: 'dashboard', title: 'Dashboard', icon: 'home', description: 'Dashboard', routes: [{ to: { name: 'dashboard' }, permission: null, title: 'Dashboard', icon: 'home' }] },
  { name: 'to-do', title: 'To Do', icon: 'inbox', description: 'Task inbox', routes: [{ to: { name: 'to-do' }, permission: null, title: 'To Do', icon: 'inbox' }] },
  {
    name: 'settings',
    title: 'Pengaturan',
    icon: 'settings',
    description: 'Pengaturan',
    routes: [
      { separator: 'System' },
      { action: users.capabilities.list!, title: 'Users', icon: 'folder' },
      { action: roles.capabilities.list!, title: 'Roles', icon: 'folder' },
      { to: { name: 'settings-role-groups' }, permission: 'view-role-groups', title: 'Role Groups', icon: 'folder' },
      { to: { name: 'settings-permissions' }, permission: 'view-permissions', title: 'Permissions', icon: 'folder' },
    ],
  },
  { name: 'quality', title: 'Quality', icon: 'folder', description: 'Quality work', routes: [{ action: pts.capabilities.list!, title: 'PTS', icon: 'folder' }] },
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
      { to: { name: 'master-data-project-vendors' }, permission: 'view-project-vendors', title: 'Vendor/Subkon/Mandor', icon: 'folder' },
      { to: { name: 'master-data-pts-work-categories' }, permission: 'view-pts-work-categories', title: 'Kategori Pekerjaan', icon: 'folder' },
      { to: { name: 'master-data-root-causes' }, permission: 'view-root-causes', title: 'Penyebab QHSSE', icon: 'folder' },
      { to: { name: 'master-data-number-configs' }, permission: 'view-number-configs', title: 'Number Configurations', icon: 'folder' },
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
      const permission = 'action' in entry ? entry.action.permission : entry.permission
      if (permission !== null && !allows(permission)) continue
      const to = 'action' in entry ? entry.action.to : entry.to
      if (!to || typeof to === 'function') continue
      routes.push({ name: (to as { name: string }).name, to, title: entry.title, icon: entry.icon })
    }
    if (routes.at(-1) && 'separator' in routes.at(-1)!) routes.pop()
    return routes.length ? [{ ...module, routes }] : []
  })
}

/** Finds entrypoint module owning path, by segment boundary then longest match. */
export function activeNavigationModule(path: string, resolve: (to: unknown) => { path: string }, allows: (permission: string) => boolean): string | undefined {
  const candidates = visibleNavigation(allows).flatMap((module, index) =>
    module.routes.flatMap((route) => {
      if ('separator' in route) return []
      const entryPath = resolve(route.to).path
      return path === entryPath || path.startsWith(`${entryPath}/`) ? [{ name: module.name, pathLength: entryPath.length, index }] : []
    })
  )
  return candidates.sort((left, right) => right.pathLength - left.pathLength || left.index - right.index)[0]?.name
}
