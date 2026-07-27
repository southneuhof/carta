import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRoutesContext, resolveOptions } from '../../../apps/web/node_modules/vue-router/dist/unplugin/index.mjs'

const root = resolve('plans/proofs/031-native-parent-typed')

const routeManifest = [
  {
    source: 'src/routes/settings/roles/index.route.vue',
    name: 'roles',
    meta: { title: 'Roles' },
  },
  {
    source: 'src/routes/settings/roles/[roleId]/_parent.route.vue',
    name: 'roles-detail',
    meta: { title: 'Detail Role', permission: 'roles.detail' },
  },
  {
    source: 'src/routes/settings/roles/[roleId]/edit.route.vue',
    name: 'roles-update',
    meta: { title: 'Edit Role', permission: 'roles.update' },
  },
  {
    source: 'src/routes/settings/roles/[roleId]/permissions/index.route.vue',
    name: 'roles-permissions',
    meta: { title: 'Permissions', permission: 'roles.update' },
  },
]

function applyRouteManifest(node) {
  for (const child of node.children) {
    applyRouteManifest(child)
  }

  const definition = routeManifest.find(({ source }) => node.component?.endsWith(`/${source}`))
  if (!definition) return
  node.name = definition.name
  node.meta = definition.meta
}

const options = resolveOptions({
  root,
  routesFolder: 'src/routes',
  extensions: ['.route.vue'],
  dts: 'route-map.d.ts',
  beforeWriteFiles: applyRouteManifest,
})
const context = createRoutesContext(options)

await context.scanPages(false)
context.writeConfigFiles()

const generatedRoutes = context.generateRoutes()
const generatedTypes = readFileSync(resolve(root, 'route-map.d.ts'), 'utf8')

assert.match(generatedRoutes, /path: ':roleId',\s+name: 'roles-detail'/)
assert.match(generatedRoutes, /_parent\.route\.vue/)
assert.match(generatedRoutes, /name: 'roles-update'/)
assert.match(generatedRoutes, /name: 'roles-permissions'/)
assert.match(generatedRoutes, /"title": "Detail Role"/)
assert.match(generatedRoutes, /"permission": "roles\.detail"/)
assert.doesNotMatch(generatedRoutes, /definePage/)

assert.match(generatedTypes, /'roles-detail': RouteRecordInfo/)
assert.match(generatedTypes, /\| 'roles-permissions'\s+\| 'roles-update'/)
assert.match(generatedTypes, /'[^']*\[roleId\]\/_parent\.route\.vue': \{\s+routes:\s+\| 'roles-detail'\s+\| 'roles-permissions'\s+\| 'roles-update'/)
assert.match(generatedTypes, /pathParamNames:\s+\| 'roleId'/)

console.log('PASS: manifest-backed _parent.route.vue generated as named parent with meta, children, and roleId')
