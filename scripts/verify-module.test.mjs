import { strict as assert } from 'node:assert'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { integrate } from './integrate-bounded-module.mjs'
import { expectedGeneratedPaths, scaffold } from './scaffold-bounded-module.mjs'
import { execute, runCommand, verificationCommands, verify } from './verify-module.mjs'

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

function ownerFiles(root) {
  writeFixtureFile(root, 'apps/api/src/routes/index.ts', `import { defineModule } from '@southneuhof/sprindle/model'
export const modules = [
  defineModule({ models: [] }),
] as const
`)
  writeFixtureFile(root, 'apps/api/src/authorization/catalog.ts', `export const permissionCodes = [
  'list-roles',
] as const
`)
  writeFixtureFile(root, 'apps/api/scripts/seed.ts', `const adminEmail = 'admin@example.com'
async function seedAuthorization() {}
async function seed() {
  await seedAuthorization()
}
`)
  writeFixtureFile(root, 'apps/web/src/manifest/navigation.ts', `export const navigation = defineNavigation([
  {
    name: 'settings',
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
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'verify-module-'))
  temporaryDirectories.push(root)
  const value = config()
  writeFileSync(join(root, 'manifest.json'), JSON.stringify(value, null, 2))
  scaffold(value, { root })
  ownerFiles(root)
  integrate(value, { root, apply: true })
  return { root, value }
}

test.afterEach(() => {
  while (temporaryDirectories.length) rmSync(temporaryDirectories.pop(), { recursive: true, force: true })
})

test('check-only verifies the generated module without changing files', () => {
  const setup = fixture()
  const paths = [
    ...expectedGeneratedPaths(setup.value, { root: setup.root }),
    join(setup.root, 'apps/api/src/routes/index.ts'),
    join(setup.root, 'apps/api/src/authorization/catalog.ts'),
    join(setup.root, 'apps/api/scripts/seed.ts'),
    join(setup.root, 'apps/web/src/manifest/navigation.ts'),
    join(setup.root, 'apps/web/src/routes/(authenticated)/settings/index.route.vue'),
  ]
  const before = new Map(paths.map((path) => [path, readFileSync(path, 'utf8')]))

  const result = verify(setup.value, { root: setup.root })
  assert.equal(result.status, 'PASS')
  assert.ok(result.static.checks.length > 10)
  assert.deepEqual(result.commands, [])
  const cliResult = JSON.parse(execute(['--manifest', 'manifest.json', '--check-only', '--json'], {
    root: setup.root,
    cwd: setup.root,
  }))
  assert.equal(cliResult.status, 'PASS')

  for (const [path, contents] of before) assert.equal(readFileSync(path, 'utf8'), contents)
})

test('fails when a generated file is missing', () => {
  const setup = fixture()
  const missing = expectedGeneratedPaths(setup.value, { root: setup.root }).find((path) => path.endsWith('.resource.spec.ts'))
  rmSync(missing)
  const result = verify(setup.value, { root: setup.root })
  assert.equal(result.status, 'FAIL')
  assert.ok(result.static.failed.some((check) => check.name === 'generated files'))
  assert.deepEqual(result.commands, [])
})

test('fails on duplicate integration metadata and invalid manifests', () => {
  const setup = fixture()
  const navigationPath = join(setup.root, 'apps/web/src/manifest/navigation.ts')
  const navigation = readFileSync(navigationPath, 'utf8')
  const routeLine = navigation.split('\n').find((line) => line.includes("settings-test-catalog"))
  writeFileSync(navigationPath, navigation.replace(routeLine, `${routeLine}\n${routeLine}`))
  const duplicateResult = verify(setup.value, { root: setup.root })
  assert.equal(duplicateResult.status, 'FAIL')
  assert.ok(duplicateResult.static.failed.some((check) => check.name === 'navigation route'))

  assert.throws(() => verify({ ...setup.value, kind: 'other' }, { root: setup.root }), /kind must be bounded-module/)
})

test('prepares the test database before seeded verification', () => {
  const commands = verificationCommands(config(), { withSeed: true }).map(([command, args]) => [command, ...args].join(' '))
  assert.equal(commands[0], 'pnpm --filter @southneuhof/api db:seed:test')
  assert.equal(commands.filter((command) => command === 'pnpm --filter @southneuhof/api db:seed:test').length, 1)
  assert.equal(commands.some((command) => command === 'pnpm --filter @southneuhof/api db:migrate'), false)
})

test('reports command duration and timeout state', () => {
  const passed = runCommand(process.execPath, ['-e', ''], { cwd: process.cwd(), timeoutMs: 1000 })
  assert.equal(passed.status, 'PASS')
  assert.equal(passed.timedOut, false)
  assert.equal(typeof passed.durationMs, 'number')

  const timedOut = runCommand(process.execPath, ['-e', 'setTimeout(() => {}, 1000)'], { cwd: process.cwd(), timeoutMs: 100 })
  assert.equal(timedOut.status, 'FAIL')
  assert.equal(timedOut.timedOut, true)
})
