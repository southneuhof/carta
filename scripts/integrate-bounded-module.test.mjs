import { strict as assert } from 'node:assert'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { integrate } from './integrate-bounded-module.mjs'

const temporaryDirectories = []

function config() {
  return {
    kind: 'bounded-module',
    slug: 'test-catalog',
    table: 'test_catalog',
    symbol: 'TestCatalog',
    title: 'Test Catalog',
    identity: { key: 'id', type: 'text', primary: true, generated: 'uuid' },
    fields: [{ key: 'label', type: 'text', label: 'Label', required: true, renderer: 'text' }],
    labels: {
      listTitle: 'Test Catalog',
      detailTitle: 'Detail Test Catalog',
      createTitle: 'Add Test Catalog',
      editTitle: 'Edit Test Catalog',
      submitLabel: 'Submit',
    },
    permissions: {
      moduleName: 'Test Catalog',
      realm: 'system',
      entries: Object.fromEntries(['view', 'list', 'detail', 'create', 'update', 'delete'].map((action) => [action, {
        name: `${action} test catalog`,
        description: `${action} test catalog records.`,
      }])),
    },
    navigation: { group: 'settings', after: 'settings-roles', title: 'Test Catalog', icon: 'folder', separator: 'Test' },
    seed: { records: [{ id: 'test-catalog-1', label: 'One' }], updateFields: ['label'] },
  }
}

function writeFixtureFile(root, relativePath, contents) {
  const path = join(root, relativePath)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, contents)
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'integrate-bounded-module-'))
  temporaryDirectories.push(root)
  writeFixtureFile(root, 'apps/api/src/routes/index.ts', `import { defineModule } from '@southneuhof/sprindle/model'

export const modules = [
  defineModule({ models: [] }),
] as const
`)
  writeFixtureFile(root, 'apps/api/src/authorization/catalog.ts', `export const permissionCodes = [
  'list-roles',
] as const
`)
  writeFixtureFile(root, 'apps/api/scripts/seed.ts', `import { sql } from 'drizzle-orm'

const adminEmail = 'admin@example.com'

async function seedAuthorization() {}

async function seed() {
  await seedAuthorization()
}
`)
  writeFixtureFile(root, 'apps/web/src/manifest/navigation.ts', `export const navigation = defineNavigation([
  {
    name: 'settings',
    title: 'Master Data',
    icon: 'folder',
    routes: [
      { to: { name: 'settings-roles' }, permission: 'view-number-configs', title: 'Number Configurations', icon: 'folder' },
      { separator: 'Work Permit' },
    ],
  },
] as const)
`)
  writeFixtureFile(root, 'apps/web/src/routes/(authenticated)/settings/index.route.vue', `<script setup lang="ts">
const entries = [
  ['number-configs', 'Number Configurations'],
] as const
</script>
`)
  return root
}

test.afterEach(() => {
  while (temporaryDirectories.length) rmSync(temporaryDirectories.pop(), { recursive: true, force: true })
})

test('integrates all owner files, reports paths, and is idempotent', () => {
  const root = fixture()
  const value = config()
  const pending = integrate(value, { root })
  assert.equal(pending.status, 'PENDING')
  assert.equal(pending.pending.length, 4)
  assert.deepEqual(pending.changed, [])

  const applied = integrate(value, { root, apply: true })
  assert.equal(applied.status, 'APPLIED')
  assert.equal(applied.changed.length, 4)
  assert.ok(applied.changed.every((path) => existsSync(path)))

  const routeIndex = readFileSync(join(root, 'apps/api/src/routes/index.ts'), 'utf8')
  assert.match(routeIndex, /testCatalogModel/)
  assert.equal((routeIndex.match(/testCatalogsDomain/g) ?? []).length, 2)
  const navigation = readFileSync(join(root, 'apps/web/src/manifest/navigation.ts'), 'utf8')
  assert.equal((navigation.match(/settings-test-catalog/g) ?? []).length, 1)
  assert.equal((navigation.match(/separator: 'Test'/g) ?? []).length, 1)
  const seed = readFileSync(join(root, 'apps/api/scripts/seed.ts'), 'utf8')
  assert.match(seed, /seedTestCatalog/)
  assert.equal((seed.match(/seedTestCatalog/g) ?? []).length, 2)

  const second = integrate(value, { root, apply: true })
  assert.equal(second.status, 'UP_TO_DATE')
  assert.deepEqual(second.changed, [])
  assert.deepEqual(second.pending, [])
})

test('places an entry after its anchor inside an existing separator', () => {
  const root = fixture()
  const navigationPath = join(root, 'apps/web/src/manifest/navigation.ts')
  const navigation = readFileSync(navigationPath, 'utf8').replace(
    "      { to: { name: 'settings-roles' }, permission: 'view-number-configs', title: 'Number Configurations', icon: 'folder' },",
    "      { separator: 'Test' },\n      { to: { name: 'settings-roles' }, permission: 'view-number-configs', title: 'Number Configurations', icon: 'folder' },",
  )
  writeFileSync(navigationPath, navigation)

  integrate(config(), { root, apply: true })
  const updated = readFileSync(navigationPath, 'utf8')
  const separator = updated.indexOf("{ separator: 'Test' }")
  const anchor = updated.indexOf('settings-roles')
  const entry = updated.indexOf('settings-test-catalog')

  assert.ok(separator < anchor && anchor < entry)
  assert.equal((updated.match(/separator: 'Test'/g) ?? []).length, 1)
})

test('fails closed on a missing anchor without writing partial changes', () => {
  const root = fixture()
  const navigationPath = join(root, 'apps/web/src/manifest/navigation.ts')
  writeFileSync(navigationPath, readFileSync(navigationPath, 'utf8').replace("settings-roles", 'missing-anchor'))
  const before = new Map([
    'apps/api/src/routes/index.ts',
    'apps/api/src/authorization/catalog.ts',
    'apps/api/scripts/seed.ts',
    'apps/web/src/manifest/navigation.ts',
    'apps/web/src/routes/(authenticated)/settings/index.route.vue',
  ].map((path) => [path, readFileSync(join(root, path), 'utf8')]))

  assert.throws(() => integrate(config(), { root, apply: true }), /navigation anchor.*missing or ambiguous/)
  for (const [path, contents] of before) assert.equal(readFileSync(join(root, path), 'utf8'), contents)
})

test('refuses duplicate route registrations', () => {
  const root = fixture()
  integrate(config(), { root, apply: true })
  const path = join(root, 'apps/api/src/routes/index.ts')
  const source = readFileSync(path, 'utf8')
  const bundleLine = '  defineModule({ domain: testCatalogsDomain, models: [testCatalogModel] }),'
  assert.equal((source.match(new RegExp(bundleLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length, 1)
  writeFileSync(path, source.replace(bundleLine, `${bundleLine}\n${bundleLine}`))
  assert.throws(() => integrate(config(), { root, apply: true }), /route registration.*duplicated/)
})
