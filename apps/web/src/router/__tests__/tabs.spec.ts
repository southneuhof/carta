import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'

const allowed = vi.fn<(permission?: string) => boolean>(() => true)
vi.mock('@southneuhof/is-vue-framework', () => ({
  useResourceRuntime: () => ({ adapters: { access: { allows: ({ permission }: { permission?: string }) => allowed(permission) } } }),
}))

import Tabs from '@/components/routing/Tabs.vue'
import type { RouteTab } from '@/router/tabs'

const Page = { render: () => h('main') }
function action(routeName: string, permission: string) {
  return { key: 'list', permission, routeName, to: { name: routeName } } as RouteTab['action']
}

const defaultItems = [
  { action: action('roles-permissions', 'roles.update'), label: 'Permissions' },
  { action: action('users-roles', 'roles.members'), label: 'Members' },
] as const

type MountOptions = {
  path?: string
  items?: readonly unknown[]
  componentless?: boolean
  mixedOwner?: boolean
}

async function mountTabs({ path = '/roles/7', items = defaultItems, componentless = false, mixedOwner = false }: MountOptions = {}) {
  const tabChildren: RouteRecordRaw[] = componentless
    ? [
        {
          path: 'group',
          children: [
            { path: 'permissions', name: 'roles-permissions', component: Page, meta: { permission: 'roles.update' } },
            { path: 'members', name: 'users-roles', component: Page, meta: { permission: 'roles.members' } },
          ],
        },
      ]
    : [
        { path: 'permissions', name: 'roles-permissions', component: Page, meta: { permission: 'roles.update' } },
        { path: 'members', name: 'users-roles', component: Page, meta: { permission: 'roles.members' } },
      ]
  const routes: RouteRecordRaw[] = [
    {
      path: '/roles/:roleId',
      name: 'roles-detail',
      component: Page,
      meta: { permission: 'roles.detail' },
      children: [...tabChildren, { path: 'edit', name: 'roles-update', component: Page, meta: { permission: 'roles.update' } }, { path: 'permissions/deep', name: 'roles-deep', component: Page }],
    },
    ...(mixedOwner ? [{ path: '/other/:roleId/edit', name: 'overtime-edit', component: Page }] : []),
  ]
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const replace = vi.spyOn(router, 'replace')
  const push = vi.spyOn(router, 'push')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(Tabs, { label: 'Role', items: items as readonly RouteTab[] })))
  app.use(router)
  app.mount(host)
  await nextTick()
  return {
    host,
    router,
    replace,
    push,
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

beforeEach(() => allowed.mockReset())
afterEach(() => vi.restoreAllMocks())

describe('route tabs', () => {
  it('replaces bare owner with first valid child, inherited params, and sibling query', async () => {
    allowed.mockReturnValue(true)
    const view = await mountTabs({ path: '/roles/7?table.page=2&filter=x' })
    await vi.waitFor(() => expect(view.router.currentRoute.value.fullPath).toBe('/roles/7/permissions?table.page=2'))
    expect(view.replace).toHaveBeenCalledOnce()
    expect(view.push).not.toHaveBeenCalled()
    view.unmount()
  })

  it('skips denied or unresolved leading tabs', async () => {
    allowed.mockImplementation((permission) => permission !== 'roles.update')
    const view = await mountTabs({ items: [{ action: action('missing', 'roles.update'), label: 'Missing' }, ...defaultItems] })
    await vi.waitFor(() => expect(view.router.currentRoute.value.name).toBe('users-roles'))
    expect(view.replace).toHaveBeenCalledOnce()
    view.unmount()
  })

  it('leaves bare owner intact when no child is valid', async () => {
    allowed.mockReturnValue(false)
    const view = await mountTabs()
    await nextTick()
    expect(view.router.currentRoute.value.name).toBe('roles-detail')
    expect(view.replace).not.toHaveBeenCalled()
    view.unmount()
  })

  it('redirects to and displays one valid child', async () => {
    allowed.mockReturnValue(true)
    const view = await mountTabs({ items: [defaultItems[0]] })
    await vi.waitFor(() => expect(view.router.currentRoute.value.name).toBe('roles-permissions'))
    expect(view.host.querySelector('[data-tab]')).not.toBeNull()
    view.unmount()
  })

  it('keeps active tab, sibling edit, and deeper descendant untouched', async () => {
    allowed.mockReturnValue(true)
    for (const path of ['/roles/7/permissions', '/roles/7/edit', '/roles/7/permissions/deep']) {
      const view = await mountTabs({ path })
      await nextTick()
      expect(view.replace).not.toHaveBeenCalled()
      view.unmount()
    }
  })

  it('uses component-bearing owner through componentless records', async () => {
    allowed.mockReturnValue(true)
    const view = await mountTabs({
      path: '/roles/7',
      componentless: true,
      items: [
        { action: action('roles-permissions', 'roles.update'), label: 'Permissions' },
        { action: action('users-roles', 'roles.members'), label: 'Members' },
      ],
    })
    await vi.waitFor(() => expect(view.router.currentRoute.value.name).toBe('roles-permissions'))
    expect(view.replace).toHaveBeenCalledOnce()
    view.unmount()
  })

  it('fails safe when valid targets do not share one owner', async () => {
    allowed.mockReturnValue(true)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const view = await mountTabs({
      mixedOwner: true,
      items: [
        { action: action('roles-permissions', 'roles.update'), label: 'Permissions' },
        { action: action('overtime-edit', 'roles.update'), label: 'Other' },
      ],
    })
    await nextTick()
    expect(view.router.currentRoute.value.name).toBe('roles-detail')
    expect(view.replace).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('[Tabs]'))
    view.unmount()
  })

  it('keeps link order, active state, and dotted query behavior', async () => {
    allowed.mockReturnValue(true)
    const view = await mountTabs({ path: '/roles/7/permissions?table.page=2&filter=x' })
    const links = [...view.host.querySelectorAll<HTMLAnchorElement>('[data-tab]')]
    expect(links.map((link) => link.dataset.tab)).toEqual(['roles-permissions', 'users-roles'])
    expect(links[0].getAttribute('aria-current')).toBe('page')
    expect(links[1].getAttribute('href')).toBe('/roles/7/members?table.page=2')
    view.unmount()
  })
})
