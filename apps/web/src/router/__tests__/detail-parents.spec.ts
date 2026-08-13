import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

vi.mock('@southneuhof/is-vue-framework', () => ({
  DetailView: defineComponent({
    props: { id: { type: String, required: true } },
    setup: (props) => () => h('div', { 'data-detail': props.id }, 'Detail'),
  }),
}))
vi.mock('@/components/routing/Tabs.vue', () => ({ default: defineComponent({
  props: { items: { type: Array, default: () => [] } },
  setup: (props) => () => h('nav', { 'data-tabs': true }, props.items.map((item: { label: string }) => h('span', { 'data-tab-label': item.label }, item.label))),
}) }))
vi.mock('@/routes/(authenticated)/settings/roles/roles.resource', () => ({
  roles: {
    detail: ({ id }: { id: string }) => ({ id }),
    list: () => ({ updateRoute: () => ({ name: 'settings-roles-edit', params: { roleId: '7' } }) }),
  },
}))
vi.mock('@/routes/(authenticated)/settings/roles/[roleId]/detail/permissions/role-permissions.resource', () => ({
  rolePermissions: { actions: { list: { key: 'list', permission: 'roles.update', routeName: 'settings-roles-detail-permissions', to: { name: 'settings-roles-detail-permissions' } } } },
}))
vi.mock('@/routes/(authenticated)/settings/users/users.resource', () => ({
  users: {
    detail: ({ id }: { id: string }) => ({ id }),
  },
}))
import RolesParent from '@/routes/(authenticated)/settings/roles/[roleId]/detail.route.vue'
import UsersParent from '@/routes/(authenticated)/settings/users/[userId]/detail.route.vue'

const Child = { render: () => h('div', { 'data-child': true }, 'Child') }
const mounted: (() => void)[] = []

afterEach(() => mounted.splice(0).forEach((unmount) => unmount()))

async function mountParent(kind: 'roles' | 'users', child: boolean) {
  const idKey = kind === 'roles' ? 'roleId' : 'userId'
  const parentName = kind === 'roles' ? 'settings-roles-detail' : 'settings-users-detail'
  const childName = kind === 'roles' ? 'settings-roles-detail-permissions' : 'settings-users-detail-system-roles'
  const parent = kind === 'roles' ? RolesParent : UsersParent
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{
      path: `/${kind}/:${idKey}`,
      name: parentName,
      component: parent,
      children: [{ path: 'child', name: childName, component: Child }],
    }],
  })
  await router.push(`/${kind}/7${child ? '/child' : ''}`)
  await router.isReady()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(RouterView)))
  app.use(createPinia())
  app.use(router)
  app.mount(host)
  await nextTick()
  mounted.push(() => { app.unmount(); host.remove() })
  return host
}

describe('marked detail parents', () => {
  it.each(['roles', 'users'] as const)('renders tabs plus detail at bare %s URL', async (kind) => {
    const host = await mountParent(kind, false)
    expect(host.querySelector('[data-tabs]')).not.toBeNull()
    expect(host.querySelector('[data-detail="7"]')).not.toBeNull()
    if (kind === 'users') expect([...host.querySelectorAll('[data-tab-label]')].map((tab) => tab.textContent)).toEqual(['System Roles', 'Project Roles'])
  })

  it.each(['roles', 'users'] as const)('renders detail-under child at %s child URL', async (kind) => {
    const host = await mountParent(kind, true)
    expect(host.querySelector('[data-tabs]')).not.toBeNull()
    expect(host.querySelector('[data-child]')).not.toBeNull()
    expect(host.querySelector('[data-detail="7"]')).not.toBeNull()
  })
})
