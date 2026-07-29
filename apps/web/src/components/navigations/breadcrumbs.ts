import type { RouteLocationNormalizedLoaded, RouteLocationRaw, Router } from 'vue-router'
import type { VisibleNavigationModule } from '@/manifest'

export type BreadcrumbItem = { label: string; to?: RouteLocationRaw }

const pageLabels: Record<string, string> = {
  create: 'Create',
  detail: 'Detail',
  edit: 'Edit',
  permissions: 'Permissions',
  roles: 'Roles',
}

function titleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function routeBreadcrumbs(
  route: RouteLocationNormalizedLoaded,
  router: Pick<Router, 'resolve'>,
  navigation: readonly VisibleNavigationModule[],
): BreadcrumbItem[] {
  if (route.name === 'notifications') return [{ label: 'Notifications' }]

  const routeName = String(route.name ?? '')
  const candidates = navigation.flatMap((module) =>
    module.routes.flatMap((entry) => {
      if ('separator' in entry) return []
      const resolved = router.resolve(entry.to as never)
      return route.path === resolved.path || route.path.startsWith(`${resolved.path}/`)
        ? [{ module, entry, resolved }]
        : []
    }),
  )
  const match = candidates.sort((a, b) => b.resolved.path.length - a.resolved.path.length)[0]

  if (!match) return [{ label: titleCase(routeName || 'Page') }]

  const items: BreadcrumbItem[] = []
  if (match.module.title !== match.entry.title) items.push({ label: match.module.title })
  const isEntrypoint = routeName === match.entry.name
  items.push({ label: match.entry.title, ...(isEntrypoint ? {} : { to: match.entry.to as RouteLocationRaw }) })

  if (!isEntrypoint) {
    const suffix = routeName.slice(match.entry.name.length).split('-').filter(Boolean)
    for (const segment of suffix) {
      const label = pageLabels[segment] ?? titleCase(segment)
      if (items.at(-1)?.label !== label) items.push({ label })
    }
  }
  return items
}
