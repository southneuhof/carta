/**
 * Compatibility for URLs produced before filesystem routes owned navigation.
 *
 * Two shapes are normalized:
 *
 *  - hash URLs from the previous `createWebHashHistory` router
 *    (`/#/settings/roles?x=1` -> `/settings/roles?x=1`);
 *  - the roles query-state dispatcher (`?roles_view=detail&roles_id=1`), which
 *    is rewritten to the real path. Unrelated query values are preserved, and
 *    an unrecognized view lands on the list with a diagnostic instead of a
 *    blank screen.
 */
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

export function normalizeHashUrl(url: string): string | undefined {
  const hashIndex = url.indexOf('#/')
  if (hashIndex === -1) return undefined
  const target = url.slice(hashIndex + 1)
  return target.startsWith('/') ? target : `/${target}`
}

/** Rewrites `location.href` on boot when it still carries a hash route. */
export function normalizeLegacyHashLocation(windowRef: Window = window): void {
  const normalized = normalizeHashUrl(windowRef.location.href)
  if (!normalized) return
  windowRef.history.replaceState(windowRef.history.state, '', normalized)
}

type ViewPaths = Record<string, ((id: string) => string) | undefined>

/** One entry per migrated feature that used the query-state dispatcher. */
const legacyFeatures: { name: string; base: string; views: ViewPaths }[] = [
  {
    name: 'roles',
    base: '/settings/roles',
    views: {
      list: () => '/settings/roles',
      create: () => '/settings/roles/new',
      detail: (id) => `/settings/roles/${id}`,
      update: (id) => `/settings/roles/${id}/edit`,
    },
  },
  {
    name: 'users',
    base: '/settings/users',
    views: {
      list: () => '/settings/users',
      detail: (id) => `/settings/users/${id}`,
      update: (id) => `/settings/users/${id}/edit`,
    },
  },
  {
    name: 'overtimes',
    base: '/hr/overtimes',
    views: {
      list: () => '/hr/overtimes',
      create: () => '/hr/overtimes/new',
      detail: (id) => `/hr/overtimes/${id}`,
      update: (id) => `/hr/overtimes/${id}/edit`,
    },
  },
]

function single(value: unknown): string | undefined {
  const resolved = Array.isArray(value) ? value[0] : value
  return resolved == null ? undefined : String(resolved)
}

export function legacyViewRedirect(to: RouteLocationNormalized): RouteLocationRaw | undefined {
  for (const feature of legacyFeatures) {
    const requested = single(to.query[`${feature.name}_view`])
    if (requested === undefined) continue

    const query = { ...to.query }
    delete query[`${feature.name}_view`]
    delete query[`${feature.name}_id`]

    const id = single(to.query[`${feature.name}_id`])
    const build = feature.views[requested]

    if (!build) {
      console.warn(`[web] Unknown legacy ${feature.name} view "${requested}"; showing the ${feature.name} list.`)
      return { path: feature.base, query }
    }
    if ((requested === 'detail' || requested === 'update') && !id) {
      console.warn(`[web] Legacy ${feature.name} view "${requested}" had no ${feature.name}_id; showing the ${feature.name} list.`)
      return { path: feature.base, query }
    }

    return { path: build(id ?? ''), query }
  }

  return undefined
}

/** @deprecated Use `legacyViewRedirect`; kept as the roles-only entry point. */
export const legacyRolesRedirect = legacyViewRedirect
