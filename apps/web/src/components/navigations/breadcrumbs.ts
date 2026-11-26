import type { RouteLocationNormalizedLoaded, RouteLocationRaw, Router } from 'vue-router'
import { activeNavigationEntry, type VisibleNavigationModule } from '@/manifest'

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

function suffixSegments(route: RouteLocationNormalizedLoaded, entryPath: string): string[] {
  const leafPath = route.matched.at(-1)?.path
  if (leafPath && leafPath.startsWith(entryPath)) {
    const rest = leafPath.slice(entryPath.length)
    return rest.split('/').filter((segment) => Boolean(segment) && !segment.startsWith(':'))
  }
  const paramValues = new Set(Object.values(route.params).flatMap((value) => (Array.isArray(value) ? value : value === undefined ? [] : [String(value)])))
  const rest = route.path.startsWith(entryPath) ? route.path.slice(entryPath.length) : ''
  return rest.split('/').filter((segment) => Boolean(segment) && !paramValues.has(segment))
}

export function routeBreadcrumbs(route: RouteLocationNormalizedLoaded, router: Pick<Router, 'resolve'>, navigation: readonly VisibleNavigationModule[]): BreadcrumbItem[] {
  const routeName = String(route.name ?? '')
  const match = activeNavigationEntry(route.path, (to) => router.resolve(to), navigation)

  if (!match) return [{ label: titleCase(routeName || 'Page') }]

  const items: BreadcrumbItem[] = []
  if (match.module.title !== match.entry.title) items.push({ label: match.module.title })
  const isEntrypoint = routeName === match.entry.name
  items.push({ label: match.entry.title, ...(isEntrypoint ? {} : { to: match.entry.to }) })

  if (!isEntrypoint) {
    const entryPath = router.resolve(match.entry.to).path
    for (const segment of suffixSegments(route, entryPath)) {
      const label = pageLabels[segment] ?? titleCase(segment)
      if (items.at(-1)?.label !== label) items.push({ label })
    }
  }
  return items
}
