import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { routeBreadcrumbs } from './breadcrumbs'
import type { VisibleNavigationModule } from '@/manifest'

const Page = { template: '<div />' }
const routes: RouteRecordRaw[] = [
  { path: '/dashboard', name: 'dashboard', component: Page },
  { path: '/settings/users', name: 'settings-users', component: Page },
  { path: '/settings/users/:userId/detail/roles', name: 'settings-users-detail-roles', component: Page },
  { path: '/notifications', name: 'notifications', component: Page },
  { path: '/unlisted-page', name: 'unlisted-page', component: Page },
]
const navigation: VisibleNavigationModule[] = [
  {
    name: 'dashboard',
    title: 'Dashboard',
    icon: 'home',
    description: 'Dashboard',
    routes: [{ name: 'dashboard', title: 'Dashboard', icon: 'home', to: { name: 'dashboard' } }],
  },
  {
    name: 'settings',
    title: 'Pengaturan',
    icon: 'settings',
    description: 'Pengaturan',
    routes: [{ name: 'settings-users', title: 'Users', icon: 'folder', to: { name: 'settings-users' } }],
  },
]

async function breadcrumbs(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  return routeBreadcrumbs(router.currentRoute.value, router, navigation)
}

describe('routeBreadcrumbs', () => {
  it('uses a single current item for a navigation entrypoint', async () => {
    expect(await breadcrumbs('/dashboard')).toEqual([{ label: 'Dashboard' }])
  })

  it('builds full hierarchy without exposing dynamic record ids', async () => {
    expect(await breadcrumbs('/settings/users/42/detail/roles')).toEqual([
      { label: 'Pengaturan' },
      { label: 'Users', to: { name: 'settings-users' } },
      { label: 'Detail' },
      { label: 'Roles' },
    ])
  })

  it('supports the global notifications route and stable fallbacks', async () => {
    expect(await breadcrumbs('/notifications')).toEqual([{ label: 'Notifications' }])
    expect(await breadcrumbs('/unlisted-page')).toEqual([{ label: 'Unlisted Page' }])
  })
})
