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

const rolesViewPaths: Record<string, (id: string) => string> = {
  list: () => '/settings/roles',
  create: () => '/settings/roles/new',
  detail: (id) => `/settings/roles/${id}`,
  update: (id) => `/settings/roles/${id}/edit`,
}

export function legacyRolesRedirect(to: RouteLocationNormalized): RouteLocationRaw | undefined {
  const view = to.query.roles_view
  if (view === undefined) return undefined

  const { roles_view: legacyView, roles_id: identity, ...query } = to.query
  void legacyView
  const requested = Array.isArray(view) ? view[0] : view
  const id = Array.isArray(identity) ? identity[0] : identity
  const build = requested ? rolesViewPaths[String(requested)] : undefined

  if (!build) {
    console.warn(`[web] Unknown legacy roles view "${String(requested)}"; showing the roles list.`)
    return { path: '/settings/roles', query }
  }

  if ((requested === 'detail' || requested === 'update') && !id) {
    console.warn(`[web] Legacy roles view "${String(requested)}" had no roles_id; showing the roles list.`)
    return { path: '/settings/roles', query }
  }

  return { path: build(String(id ?? '')), query }
}
