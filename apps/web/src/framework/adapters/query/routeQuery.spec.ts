import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent, effectScope, h } from 'vue'
import { createRouteQueryAdapter, mergeNamespace, readNamespace } from './routeQuery'

/** Router navigation resolves on a macrotask, so nextTick alone is not enough. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const Blank = defineComponent(() => () => h('div'))

async function createTestRouter(initial = '/roles'): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/roles', component: Blank },
      { path: '/users', component: Blank },
    ],
  })
  await router.push(initial)
  await router.isReady()
  return router
}

describe('route query adapter', () => {
  it('reads and writes dotted namespaces', async () => {
    const router = await createTestRouter('/roles?roles.page=2')
    const adapter = createRouteQueryAdapter(router)

    expect(adapter.read('roles')).toEqual({ page: '2' })

    adapter.write('roles', { page: 3, search: 'admin' })
    await settle()

    expect(router.currentRoute.value.query).toEqual({ 'roles.page': '3', 'roles.search': 'admin' })
  })

  it('preserves unrelated and sibling query parameters', () => {
    const merged = mergeNamespace({ tab: 'summary', 'victims.page': '4', 'roles.page': '1' }, 'roles', { page: 2 })

    expect(merged).toEqual({ tab: 'summary', 'victims.page': '4', 'roles.page': '2' })
  })

  it('drops empty values instead of writing blank parameters', () => {
    expect(mergeNamespace({}, 'roles', { page: 1, search: '', tags: [] })).toEqual({ 'roles.page': '1' })
  })

  it('replaces rather than pushes, keeping back navigation meaningful', async () => {
    const router = await createTestRouter('/roles')
    const adapter = createRouteQueryAdapter(router)
    await router.push('/users')

    adapter.write('users', { page: 2 })
    await settle()
    router.back()
    await settle()

    expect(router.currentRoute.value.path).toBe('/roles')
  })

  it('notifies watchers only when the namespace changes', async () => {
    const router = await createTestRouter('/roles')
    const adapter = createRouteQueryAdapter(router)
    const seen: unknown[] = []
    const scope = effectScope()
    scope.run(() => adapter.watch('roles', (values) => seen.push(values)))

    await router.replace({ query: { tab: 'summary' } })
    await settle()
    expect(seen).toHaveLength(0)

    await router.replace({ query: { tab: 'summary', 'roles.page': '2' } })
    await settle()
    expect(seen).toEqual([{ page: '2' }])

    scope.stop()
  })

  it('reads only the requested namespace', () => {
    expect(readNamespace({ 'roles.page': '1', 'users.page': '9', tab: 'x' }, 'users')).toEqual({ page: '9' })
  })
})
