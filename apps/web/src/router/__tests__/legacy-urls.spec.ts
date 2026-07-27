import { describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { legacyRolesRedirect, normalizeHashUrl, normalizeLegacyHashLocation } from '../legacy-urls'

const location = (query: Record<string, string | string[]>) => ({ query } as unknown as RouteLocationNormalized)

describe('legacy hash URLs', () => {
  it('rewrites a hash route to its history-mode path', () => {
    expect(normalizeHashUrl('https://app.test/#/settings/roles?page=2')).toBe('/settings/roles?page=2')
    expect(normalizeHashUrl('https://app.test/settings/roles')).toBeUndefined()
  })

  it('replaces the browser location on boot without adding history entries', () => {
    const replaceState = vi.fn()
    normalizeLegacyHashLocation({
      location: { href: 'https://app.test/#/settings/roles' },
      history: { state: { key: 1 }, replaceState },
    } as unknown as Window)

    expect(replaceState).toHaveBeenCalledWith({ key: 1 }, '', '/settings/roles')
  })

  it('leaves history-mode locations alone', () => {
    const replaceState = vi.fn()
    normalizeLegacyHashLocation({
      location: { href: 'https://app.test/settings/roles' },
      history: { state: null, replaceState },
    } as unknown as Window)

    expect(replaceState).not.toHaveBeenCalled()
  })
})

describe('legacy roles query-state URLs', () => {
  it('ignores routes without the legacy view parameter', () => {
    expect(legacyRolesRedirect(location({}))).toBeUndefined()
  })

  it('redirects every known view to its route', () => {
    expect(legacyRolesRedirect(location({ roles_view: 'list' }))).toEqual({ path: '/settings/roles', query: {} })
    expect(legacyRolesRedirect(location({ roles_view: 'detail', roles_id: '7' }))).toEqual({ path: '/settings/roles/7', query: {} })
    expect(legacyRolesRedirect(location({ roles_view: 'update', roles_id: '7' }))).toEqual({ path: '/settings/roles/7/edit', query: {} })
  })

  it('preserves unrelated query values', () => {
    expect(legacyRolesRedirect(location({ roles_view: 'list', tab: 'summary' }))).toEqual({
      path: '/settings/roles',
      query: { tab: 'summary' },
    })
  })

  it('falls back to the list with a diagnostic for unknown or malformed views', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(legacyRolesRedirect(location({ roles_view: 'archive' }))).toEqual({ path: '/settings/roles', query: {} })
    expect(legacyRolesRedirect(location({ roles_view: 'create' }))).toEqual({ path: '/settings/roles', query: {} })
    expect(legacyRolesRedirect(location({ roles_view: 'detail' }))).toEqual({ path: '/settings/roles', query: {} })
    expect(warn).toHaveBeenCalledTimes(3)

    warn.mockRestore()
  })

  it('accepts repeated query parameters', () => {
    expect(legacyRolesRedirect(location({ roles_view: ['detail'], roles_id: ['7'] }))).toEqual({
      path: '/settings/roles/7',
      query: {},
    })
  })
})

describe('legacy users query-state URLs', () => {
  it('redirects the views the users screen supported', () => {
    expect(legacyRolesRedirect(location({ users_view: 'list' }))).toEqual({ path: '/settings/users', query: {} })
    expect(legacyRolesRedirect(location({ users_view: 'detail', users_id: '7' }))).toEqual({ path: '/settings/users/7', query: {} })
    expect(legacyRolesRedirect(location({ users_view: 'update', users_id: '7' }))).toEqual({ path: '/settings/users/7/edit', query: {} })
  })

  it('falls back to the users list for views the backend never supported', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(legacyRolesRedirect(location({ users_view: 'create' }))).toEqual({ path: '/settings/users', query: {} })
    expect(warn).toHaveBeenCalledOnce()

    warn.mockRestore()
  })
})

describe('legacy overtimes query-state URLs', () => {
  it('redirects every view the overtime screen supports', () => {
    expect(legacyRolesRedirect(location({ overtimes_view: 'list' }))).toEqual({ path: '/hr/overtimes', query: {} })
    expect(legacyRolesRedirect(location({ overtimes_view: 'detail', overtimes_id: '7' }))).toEqual({ path: '/hr/overtimes/7', query: {} })
    expect(legacyRolesRedirect(location({ overtimes_view: 'update', overtimes_id: '7' }))).toEqual({ path: '/hr/overtimes/7/edit', query: {} })
  })

  it('preserves unrelated query values', () => {
    expect(legacyRolesRedirect(location({ overtimes_view: 'detail', overtimes_id: '7', tab: 'chain' }))).toEqual({
      path: '/hr/overtimes/7',
      query: { tab: 'chain' },
    })
  })

  it('falls back to the list when a detail link carries no id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(legacyRolesRedirect(location({ overtimes_view: 'detail' }))).toEqual({ path: '/hr/overtimes', query: {} })
    expect(warn).toHaveBeenCalledOnce()

    warn.mockRestore()
  })

  it('falls back with a diagnostic for retired create links', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(legacyRolesRedirect(location({ overtimes_view: 'create' }))).toEqual({ path: '/hr/overtimes', query: {} })
    expect(warn).toHaveBeenCalledOnce()

    warn.mockRestore()
  })
})
