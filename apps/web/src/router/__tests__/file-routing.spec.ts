import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type RouteRecordRaw } from 'vue-router'
import { createRoutesContext, resolveOptions, type EditableTreeNode } from 'vue-router/unplugin'
import { afterEach, describe, expect, it } from 'vitest'
import { applyFileRouteConventions } from '../file-routing/layout-groups'
import { staticRouteName } from '../file-routing/names'

const fixtures: string[] = []

afterEach(async () => Promise.all(fixtures.splice(0).map((fixture) => rm(fixture, { recursive: true, force: true }))))

async function scan(files: Record<string, string>, repeat = false) {
  const root = await mkdtemp(join(tmpdir(), 'carta-routes-'))
  fixtures.push(root)
  for (const [relative, source] of Object.entries(files)) {
    const file = join(root, relative)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, source)
  }
  let routes: RouteRecordRaw[] = []
  const context = createRoutesContext(
    resolveOptions({
      root,
      routesFolder: '.',
      extensions: ['.route.vue', '.layout.vue'],
      dts: false,
      watch: false,
      getRouteName: staticRouteName,
      beforeWriteFiles(tree) {
        applyFileRouteConventions(tree)
        if (repeat) applyFileRouteConventions(tree)
        const record = (node: EditableTreeNode): RouteRecordRaw => ({
          path: node.path,
          ...(node.name ? { name: node.name } : {}),
          ...(node.component
            ? {
                component: defineComponent({
                  name: node.component.slice(root.length + 1),
                  render: () => h('div', [node.component!.slice(root.length + 1), readFileSync(node.component!, 'utf8').includes('<RouterView') ? h(RouterView) : null]),
                }),
              }
            : {}),
          meta: { ...node.meta } as RouteRecordRaw['meta'],
          children: node.children.map(record),
        })
        routes = tree.children.map(record)
      },
    })
  )
  try {
    await context.scanPages(false)
  } finally {
    context.stopWatcher()
  }
  return createRouter({ history: createMemoryHistory(), routes })
}

const outlet = '<template><div><RouterView /></div></template>\n'
const page = '<template><div>page</div></template>\n'

describe('native file routing', () => {
  it.each([
    ['users/[userId]/detail/roles/[roleId]/detail.route.vue', ['user', 'role']],
    ['users/[userId]/detail.roles.[roleId].detail.route.vue', ['role']],
  ])('keeps the same URL, params, and name for %s', async (destination, rendered) => {
    const router = await scan({
      'users/[userId]/detail.route.vue': outlet,
      [destination]: page,
    })
    const route = router.resolve('/users/u1/detail/roles/r1/detail')
    expect(route.name).toBe('users-detail-roles-detail')
    expect(route.params).toEqual({ userId: 'u1', roleId: 'r1' })
    expect(route.matched.flatMap((match) => (match.components?.default as any)?.name ?? [])).toEqual(rendered.map((name) => (name === 'user' ? 'users/[userId]/detail.route.vue' : destination)))
  })

  it('supports intermediate replacement, index replacement, groups, and parameter grammar', async () => {
    const router = await scan({
      '(authenticated)/authenticated.layout.vue': outlet,
      '(authenticated)/users/[userId]/detail.route.vue': outlet,
      '(authenticated)/users/[userId]/detail/roles/index.route.vue': page,
      '(authenticated)/users/[userId]/detail/roles/[roleId]/detail.route.vue': outlet,
      '(authenticated)/users/[userId]/detail/roles/[roleId]/detail.permissions.[permissionId].detail.route.vue': page,
      '(public)/docs/[[lang]]/[...path].route.vue': page,
      '(public)/tags/[[...tags]].route.vue': page,
    })
    const route = router.resolve('/users/u1/detail/roles/r1/detail/permissions/p1/detail')
    expect(route.name).toBe('users-detail-roles-detail-permissions-detail')
    expect(route.params).toEqual({ userId: 'u1', roleId: 'r1', permissionId: 'p1' })
    expect(route.meta.requiresAuth).toBe(true)
    expect(route.matched.flatMap((match) => (match.components?.default as any)?.name ?? [])).toEqual([
      '(authenticated)/authenticated.layout.vue',
      '(authenticated)/users/[userId]/detail.route.vue',
      '(authenticated)/users/[userId]/detail/roles/[roleId]/detail.permissions.[permissionId].detail.route.vue',
    ])
    expect(router.resolve('/docs/en/a.b').params).toEqual({ lang: 'en', path: 'a.b' })
    expect(router.resolve('/tags/a/b').params).toEqual({ tags: 'a/b' })
  })

  it('accepts an empty index child and a conditional outlet', async () => {
    const router = await scan({
      'users/[userId]/detail.route.vue': '<template><RouterView v-if="ready" /></template>',
      'users/[userId]/detail/index.route.vue': page,
    })
    const host = document.createElement('div')
    const app = createApp(defineComponent(() => () => h(RouterView)))
    app.use(router).mount(host)
    await router.push('/users/7/detail')
    await nextTick()
    expect(host.textContent).toContain('detail/index.route.vue')
    await router.push({ name: 'users-detail', params: { userId: '8' } } as never)
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/users/8/detail')
    expect(host.textContent).toContain('detail/index.route.vue')
    app.unmount()
  })

  it('allows repeated convention hooks', async () => {
    await expect(scan({ '(authenticated)/authenticated.layout.vue': outlet, '(authenticated)/index.route.vue': page }, true)).resolves.toBeDefined()
  })

  it('rejects a rendered parent without an outlet', async () => {
    await expect(scan({ 'users/[userId]/detail.route.vue': page, 'users/[userId]/detail/roles/index.route.vue': page })).rejects.toThrow(/detail\.route\.vue/)
  })

  it.each(['users/[userId]/detail/index.route.vue', 'users/[userId]/detail/roles.route.vue'])('rejects an immediate child when its parent has no outlet: %s', async (child) => {
    await expect(scan({ 'users/[userId]/detail.route.vue': page, [child]: page })).rejects.toThrow(/detail\.route\.vue/)
  })

  it('does not count outlet text in comments or scripts', async () => {
    await expect(
      scan({
        'users/[userId]/detail.route.vue': '<script setup>const text = `<RouterView />`</script><template><!-- <RouterView /> --><div /></template>',
        'users/[userId]/detail/index.route.vue': page,
      })
    ).rejects.toThrow(/detail\.route\.vue/)
  })

  it('rejects duplicate effective paths when names differ', async () => {
    await expect(
      scan({
        'one.route.vue': '<route>{ "path": "/same", "name": "one" }</route><template><div /></template>',
        'two.route.vue': '<route>{ "path": "/same", "name": "two" }</route><template><div /></template>',
      })
    ).rejects.toThrow(/Duplicate route path/)
  })

  it('rejects duplicate nested and dotted destinations', async () => {
    await expect(
      scan({
        'users/[userId]/detail.route.vue': outlet,
        'users/[userId]/detail/roles/[roleId]/detail.route.vue': page,
        'users/[userId]/detail.roles.[roleId].detail.route.vue': page,
      })
    ).rejects.toThrow(/Duplicate route (?:name|path)/)
  })
})
