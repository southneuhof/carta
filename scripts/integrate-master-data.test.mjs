import { strict as assert } from 'node:assert'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { integrate } from './integrate-master-data.mjs'

const temporaryDirectories = []

function config() {
  return {
    kind: 'simple-master-data',
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
      createSuccessMessage: 'Created test catalog.',
      updateSuccessMessage: 'Updated test catalog.',
    },
    permissions: {
      moduleName: 'Test Catalog',
      realm: 'system',
      entries: Object.fromEntries(['view', 'list', 'detail', 'create', 'update', 'delete'].map((action) => [action, {
        name: `${action} test catalog`,
        description: `${action} test catalog records.`,
      }])),
    },
    navigation: { after: 'master-data-number-configs', title: 'Test Catalog', icon: 'folder', separator: 'Test' },
    seed: { records: [{ id: 'test-catalog-1', label: 'One' }], updateFields: ['label'] },
  }
}

function writeFixtureFile(root, relativePath, contents) {
  const path = join(root, relativePath)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, contents)
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'integrate-master-data-'))
  temporaryDirectories.push(root)
  writeFixtureFile(root, 'apps/api/src/routes/index.ts', `import { numberConfigModel, domain as numberConfigsDomain } from "./number-configs/number-configs";

export const domainParts = [
  numberConfigsDomain,
] as const;

const installedRoutes = [
  numberConfigModel,
] as const;

export const routes = [...installedRoutes] as const;
`)
  writeFixtureFile(root, 'apps/api/src/authorization/catalog.ts', `type ModuleDefinition = { code: string; name: string; realm: 'system' | 'project'; active: true; permissions: readonly unknown[] };

export const authorizationModules = [
  { code: "number-configs", name: "Number Configurations", realm: "system", active: true, permissions: [] },
] as const satisfies readonly ModuleDefinition[];
`)
  writeFixtureFile(root, 'apps/api/scripts/seed.ts', `import { sql } from 'drizzle-orm'

const seedEmail = 'admin@example.com'

async function seedAuthorization() {}

async function main() {
  await seedAuthorization()
}
`)
  writeFixtureFile(root, 'apps/web/src/manifest/navigation.ts', `export const navigation = defineNavigation([
  {
    name: 'master-data',
    title: 'Master Data',
    icon: 'folder',
    routes: [
      { to: { name: 'master-data-number-configs' }, permission: 'view-number-configs', title: 'Number Configurations', icon: 'folder' },
      { separator: 'Work Permit' },
    ],
  },
] as const)
`)
  writeFixtureFile(root, 'apps/web/src/routes/(authenticated)/master-data/index.route.vue', `<script setup lang="ts">
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
  assert.equal(pending.pending.length, 5)
  assert.deepEqual(pending.changed, [])

  const applied = integrate(value, { root, apply: true })
  assert.equal(applied.status, 'APPLIED')
  assert.equal(applied.changed.length, 5)
  assert.ok(applied.changed.every((path) => existsSync(path)))

  const routeIndex = readFileSync(join(root, 'apps/api/src/routes/index.ts'), 'utf8')
  assert.match(routeIndex, /testCatalogModel/)
  assert.equal((routeIndex.match(/testCatalogsDomain/g) ?? []).length, 2)
  const navigation = readFileSync(join(root, 'apps/web/src/manifest/navigation.ts'), 'utf8')
  assert.equal((navigation.match(/master-data-test-catalog/g) ?? []).length, 1)
  assert.equal((navigation.match(/separator: 'Test'/g) ?? []).length, 1)
  const seed = readFileSync(join(root, 'apps/api/scripts/seed.ts'), 'utf8')
  assert.match(seed, /seedTestCatalog/)
  assert.equal((seed.match(/seedTestCatalog/g) ?? []).length, 2)

  const second = integrate(value, { root, apply: true })
  assert.equal(second.status, 'UP_TO_DATE')
  assert.deepEqual(second.changed, [])
  assert.deepEqual(second.pending, [])
})

test('fails closed on a missing anchor without writing partial changes', () => {
  const root = fixture()
  const navigationPath = join(root, 'apps/web/src/manifest/navigation.ts')
  writeFileSync(navigationPath, readFileSync(navigationPath, 'utf8').replace("master-data-number-configs", 'missing-anchor'))
  const before = new Map([
    'apps/api/src/routes/index.ts',
    'apps/api/src/authorization/catalog.ts',
    'apps/api/scripts/seed.ts',
    'apps/web/src/manifest/navigation.ts',
    'apps/web/src/routes/(authenticated)/master-data/index.route.vue',
  ].map((path) => [path, readFileSync(join(root, path), 'utf8')]))

  assert.throws(() => integrate(config(), { root, apply: true }), /navigation\.after.*missing or ambiguous/)
  for (const [path, contents] of before) assert.equal(readFileSync(join(root, path), 'utf8'), contents)
})

test('refuses duplicate route registrations', () => {
  const root = fixture()
  integrate(config(), { root, apply: true })
  const path = join(root, 'apps/api/src/routes/index.ts')
  const source = readFileSync(path, 'utf8')
  assert.equal((source.match(/  testCatalogsDomain,/g) ?? []).length, 1)
  writeFileSync(path, source.replace('  testCatalogsDomain,\n', '  testCatalogsDomain,\n  testCatalogsDomain,\n'))
  assert.equal((readFileSync(path, 'utf8').match(/  testCatalogsDomain,/g) ?? []).length, 2)
  assert.throws(() => integrate(config(), { root, apply: true }), /domain registration.*duplicated/)
})
