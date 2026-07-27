import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRoutesContext, resolveOptions } from '../../../apps/web/node_modules/vue-router/dist/unplugin/index.mjs'
import { actions, events, resetRegistry } from './action-registry.mjs'

const root = resolve('plans/proofs/035-mechanical-routes')
const require = createRequire(import.meta.url)
const { createMemoryHistory, createRouter } = require('../../../apps/web/node_modules/vue-router')

function staticRouteName(node) {
  const segments = []
  for (let current = node; current; current = current.parent) {
    const segment = current.value.rawSegment
    if (segment && segment !== 'index' && !segment.startsWith('(') && !segment.includes('[')) segments.unshift(segment)
  }
  return segments.join('-')
}

function applyFixtureConventions(rootNode) {
  const layout = rootNode.children.find((child) => child.component?.endsWith('.layout.vue'))
  if (layout) {
    rootNode.components.set('default', layout.component)
    layout.delete()
  }
  for (const child of rootNode.children) applyFixtureConventions(child)
  if (!rootNode.component) rootNode.name = false
}

const options = resolveOptions({
  root,
  routesFolder: 'src/routes',
  extensions: ['.route.vue', '.layout.vue'],
  dts: 'route-map.d.ts',
  getRouteName: staticRouteName,
  beforeWriteFiles: applyFixtureConventions,
})
const context = createRoutesContext(options)

await context.scanPages(false)

const generatedRoutes = context.generateRoutes()
const generatedTypes = readFileSync(resolve(root, 'route-map.d.ts'), 'utf8')
const expectedNames = [
  'settings-roles',
  'settings-roles-new',
  'settings-roles-edit',
  'settings-roles-detail',
  'settings-roles-detail-permissions',
  'organizations-users-detail',
  'not-found',
]

for (const name of expectedNames) assert.match(generatedRoutes, new RegExp(`name: '${name}'`))
assert.match(generatedRoutes, /path: 'detail',\s+name: 'settings-roles-detail'/)
assert.match(generatedRoutes, /name: 'settings-roles-detail',[\s\S]*path: 'permissions',[\s\S]*name: 'settings-roles-detail-permissions'/)
assert.match(generatedRoutes, /path: 'organizations',[\s\S]*path: ':organizationId',[\s\S]*path: 'users',[\s\S]*path: ':userId',[\s\S]*name: 'organizations-users-detail'/)
assert.match(generatedTypes, /'settings-roles-detail': RouteRecordInfo/)
assert.match(generatedTypes, /\| 'settings-roles-detail-permissions'/)
assert.match(generatedTypes, /'settings-roles-detail-permissions': RouteRecordInfo<[\s\S]*\{ roleId: ParamValue<true> \}/)
assert.match(generatedTypes, /'organizations-users-detail': RouteRecordInfo<[\s\S]*\{ organizationId: ParamValue<true>, userId: ParamValue<true> \}/)
assert.doesNotMatch(generatedRoutes, /_parent\.route\.vue/)
assert.doesNotMatch(generatedRoutes, /name: '(?:authenticated|[^']*index[^']*|[^']*(?:roleId|organizationId|userId|_parent|create|update)[^']*)'/)

const names = [...generatedRoutes.matchAll(/name: '([^']+)'/g)].map((match) => match[1])
assert.equal(new Set(names).size, names.length)
console.log('PASS: static-only names and same-name detail nesting generated correctly')

resetRegistry()
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{
    path: '/settings/roles/:roleId/detail',
    name: 'settings-roles-detail',
    component: () => import(`./lazy-detail.mjs?proof=${Date.now()}`),
  }],
})
router.beforeEach(() => {
  assert.equal(actions.has('settings-roles-detail'), false)
  events.push('beforeEach')
})
router.beforeResolve(() => {
  assert.equal(actions.has('settings-roles-detail'), true)
  events.push('beforeResolve')
})
router.afterEach(() => events.push('afterEach'))
await router.push('/settings/roles/7/detail')
assert.deepEqual(events, ['beforeEach', 'lazy-module-evaluated', 'action-registered', 'beforeResolve', 'afterEach'])
console.log('PASS: lazy resource module registered its action before beforeResolve')
