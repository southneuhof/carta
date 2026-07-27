import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onMounted, onUnmounted } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import AppRouterView from './AppRouterView.vue'
import { keyManager } from '@/stores/keyManager'

type Counter = { mounts: number; unmounts: number }
type Counters = Record<string, Counter>

const mounted: (() => void)[] = []

afterEach(() => {
  mounted.splice(0).forEach((unmount) => unmount())
  vi.useRealTimers()
})

function tracked(name: string, counters: Counters, childOutlet = false) {
  return defineComponent({
    name,
    setup() {
      const counter = (counters[name] ??= { mounts: 0, unmounts: 0 })
      onMounted(() => counter.mounts++)
      onUnmounted(() => counter.unmounts++)
      return () => h('section', { 'data-route': name }, [name, childOutlet ? h(AppRouterView) : null])
    },
  })
}

async function settle() {
  await nextTick()
  await vi.runAllTimersAsync()
  await nextTick()
}

async function mountRoutes(initialPath: string) {
  vi.useFakeTimers()
  const counters: Counters = {}
  const Shell = tracked('shell', counters, true)
  const List = tracked('list', counters)
  const Detail = tracked('detail', counters, true)
  const Permissions = tracked('permissions', counters, true)
  const Edit = tracked('edit', counters)
  const Deep = tracked('deep', counters)
  const Grouped = tracked('grouped', counters)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'shell',
        component: Shell,
        children: [
          { path: 'roles', name: 'roles-list', component: List },
          {
            path: 'roles/:roleId',
            name: 'roles-detail',
            component: Detail,
            children: [
              {
                path: 'permissions',
                name: 'roles-permissions',
                component: Permissions,
                children: [{ path: 'deep/:memberId', name: 'roles-permissions-deep', component: Deep }],
              },
              { path: 'edit', name: 'roles-update', component: Edit },
              {
                path: 'group',
                children: [{ path: 'deep', name: 'roles-grouped', component: Grouped }],
              },
            ],
          },
        ],
      },
    ],
  })
  const pinia = createPinia()
  setActivePinia(pinia)
  keyManager().destroyAll()
  await router.push(initialPath)
  await router.isReady()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(RouterView)))
  app.component(
    'Transition',
    defineComponent({
      setup(_, { slots }) {
        return () => slots.default?.()
      },
    })
  )
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await settle()
  mounted.push(() => {
    app.unmount()
    host.remove()
  })
  return { counters, host, router }
}

describe('AppRouterView', () => {
  it('keeps parent outlet mounted while child routes change', async () => {
    const { counters, router } = await mountRoutes('/roles/7')
    await router.push('/roles/7/permissions')
    await settle()
    expect(counters.shell.mounts).toBe(1)
    expect(counters.detail.mounts).toBe(1)
    expect(counters.permissions.mounts).toBe(1)

    await router.push('/roles/7/edit')
    await settle()
    expect(counters.shell.mounts).toBe(1)
    expect(counters.detail.mounts).toBe(1)
    expect(counters.permissions.unmounts).toBe(1)
    expect(counters.edit.mounts).toBe(1)
  })

  it('remounts rendered record for its own param change', async () => {
    const { counters, router } = await mountRoutes('/roles/7/permissions')
    await router.push('/roles/8/permissions')
    await settle()
    expect(counters.shell.mounts).toBe(1)
    expect(counters.detail.mounts).toBe(2)
    expect(counters.permissions.mounts).toBe(2)
  })

  it('does not remount records for query/hash-only changes', async () => {
    const { counters, router } = await mountRoutes('/roles/7/permissions?filter=open#top')
    await router.push('/roles/7/permissions?filter=closed#bottom')
    await settle()
    expect(counters.shell.mounts).toBe(1)
    expect(counters.detail.mounts).toBe(1)
    expect(counters.permissions.mounts).toBe(1)
  })

  it('keeps ancestors mounted when third rendered outlet changes', async () => {
    const { counters, router } = await mountRoutes('/roles/7/permissions')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await router.push('/roles/7/permissions/deep/9')
    await settle()
    expect(counters.shell.mounts).toBe(1)
    expect(counters.detail.mounts).toBe(1)
    expect(counters.permissions.mounts).toBe(1)
    expect(counters.deep.mounts).toBe(1)
    expect(warn.mock.calls.flat().join(' ')).not.toContain('Discarded invalid param')
    warn.mockRestore()
  })

  it('skips componentless matched records at outlet depth', async () => {
    const { counters, host } = await mountRoutes('/roles/7/group/deep')
    expect(counters.detail.mounts).toBe(1)
    expect(counters.grouped.mounts).toBe(1)
    expect(host.querySelector('[data-route="grouped"]')).not.toBeNull()
  })

  it('remounts route pages when rendered records change', async () => {
    const { counters, router } = await mountRoutes('/roles')
    await router.push('/roles/7/permissions')
    await settle()
    expect(counters.shell.mounts).toBe(1)
    expect(counters.list.unmounts).toBe(1)
    expect(counters.detail.mounts).toBe(1)
    expect(counters.permissions.mounts).toBe(1)
  })

  it('refreshes only outlet whose record key changed', async () => {
    const { counters } = await mountRoutes('/roles/7/permissions')
    keyManager().triggerChange('roles-permissions')
    await settle()
    expect(counters.detail.mounts).toBe(1)
    expect(counters.permissions.mounts).toBe(2)

    keyManager().triggerChange('roles-detail')
    await settle()
    expect(counters.detail.mounts).toBe(2)
    expect(counters.permissions.mounts).toBe(3)
  })

  it('does not throw before any record matches', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    const pinia = createPinia()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(AppRouterView)
    app.use(pinia)
    app.use(router)
    expect(() => app.mount(host)).not.toThrow()
    mounted.push(() => {
      app.unmount()
      host.remove()
    })
  })
})
