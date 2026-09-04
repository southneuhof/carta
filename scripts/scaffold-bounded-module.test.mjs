import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { test } from 'node:test'
import { execute } from './scaffold-bounded-module.mjs'

const temporaryDirectories = []

function workspace(config) {
  const directory = mkdtempSync(join(tmpdir(), 'scaffold-bounded-module-'))
  temporaryDirectories.push(directory)
  const configPath = join(directory, 'config.json')
  const outputRoot = join(directory, 'repository')
  writeFileSync(configPath, JSON.stringify(config, null, 2))
  return { directory, configPath, outputRoot }
}

function config() {
  return {
    kind: 'bounded-module',
    slug: 'test-catalog',
    table: 'test_catalog',
    symbol: 'TestCatalog',
    title: 'Test Catalog',
    identity: { key: 'id', type: 'text', primary: true, generated: 'uuid' },
    fields: [
      { key: 'label', type: 'text', label: 'Label', required: true, renderer: 'text' },
      {
        key: 'enabled',
        type: 'boolean',
        label: 'Enabled',
        default: true,
        renderer: 'radio',
        options: [{ id: true, name: 'Active' }, { id: false, name: 'Inactive' }],
      },
    ],
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
    navigation: {
      group: 'settings',
      after: 'settings-roles',
      title: 'Test Catalog',
      icon: 'folder',
      separator: 'Test',
    },
    seed: {
      records: [{ id: 'test-catalog-1', label: 'One', enabled: true }],
      updateFields: ['label', 'enabled'],
    },
  }
}

test.afterEach(() => {
  while (temporaryDirectories.length) rmSync(temporaryDirectories.pop(), { recursive: true, force: true })
})

test('creates explicit source files and stable absolute output', () => {
  const setup = workspace(config())
  const result = JSON.parse(execute(['--config', setup.configPath, '--json'], { root: setup.outputRoot, cwd: setup.directory }))
  const expectedRelative = [
    'apps/api/src/routes/test-catalog/test-catalog.entity.ts',
    'apps/api/src/routes/test-catalog/test-catalog.routes.spec.ts',
    'apps/api/src/routes/test-catalog/test-catalog.seed.ts',
    'apps/api/src/routes/test-catalog/test-catalog.ts',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/[testCatalogId]/detail.route.vue',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/[testCatalogId]/edit.route.vue',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/create.route.vue',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/index.route.vue',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/test-catalog.integration.spec.ts',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/test-catalog.resource.spec.ts',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/test-catalog.resource.ts',
    'apps/web/src/routes/(authenticated)/settings/test-catalog/test-catalog.schema.ts',
  ].map((path) => resolve(setup.outputRoot, path)).sort()

  assert.deepEqual(result.generated, expectedRelative)
  assert.deepEqual(result.generated, [...result.generated].sort())
  assert.deepEqual(result.integration, [...result.integration].sort())
  assert.deepEqual(result.manual, [...result.manual].sort())
  assert.ok(result.generated.every((path) => isAbsolute(path) && readFileSync(path, 'utf8')))
  assert.ok(result.manual.every((path) => isAbsolute(path)))
  assert.ok(result.integration.some((path) => path.endsWith('/apps/api/src/routes/index.ts')))
  assert.ok(result.integration.some((path) => path.endsWith('/apps/api/src/authorization/catalog.ts')))
  assert.ok(result.integration.some((path) => path.endsWith('/apps/api/scripts/seed.ts')))
  assert.ok(result.integration.some((path) => path.endsWith('/apps/web/src/manifest/navigation.ts')))
  assert.equal(result.manual.length, 1)
  assert.ok(result.manual.some((path) => path.endsWith('/apps/web/src/route-map.d.ts')))
  assert.equal(result.routes.list, 'settings-test-catalog')
  assert.equal(result.permissions.list, 'list-test-catalog')

  const entity = readFileSync(result.generated.find((path) => path.endsWith('.entity.ts')), 'utf8')
  assert.match(entity, /label: text\('label'\)/)
  assert.match(entity, /enabled: boolean\('enabled'\)/)
  assert.doesNotMatch(entity, /\b(name|description|active)\s*:/)
  assert.doesNotMatch(entity, /auditFields/)

  const createRoute = readFileSync(result.generated.find((path) => path.endsWith('/create.route.vue')), 'utf8')
  assert.match(createRoute, /title="Add Test Catalog"/)
  assert.match(createRoute, /submit-label="Submit"/)
  assert.match(createRoute, /<template><FormView v-bind="testCatalogs\.create\(\)" title="Add Test Catalog" submit-label="Submit" \/><\/template>/)

  const editRoute = readFileSync(result.generated.find((path) => path.endsWith('/edit.route.vue')), 'utf8')
  assert.match(editRoute, /title="Edit Test Catalog"/)
  assert.match(editRoute, /<template><FormView v-bind="testCatalogs\.update\(\{ id: String\(route\.params\.testCatalogId\) \}\)" title="Edit Test Catalog" submit-label="Submit" \/><\/template>/)

  const resource = readFileSync(result.generated.find((path) => path.endsWith('.resource.ts')), 'utf8')
  assert.match(resource, /title: 'Detail Test Catalog'/)

  const detailRoute = readFileSync(result.generated.find((path) => path.endsWith('/detail.route.vue')), 'utf8')
  assert.doesNotMatch(detailRoute, /title=|back-to=/)
  assert.match(detailRoute, /<template><DetailView v-bind="testCatalogs\.detail\(\{ id: String\(route\.params\.testCatalogId\) \}\)" \/><\/template>/)

  const seed = readFileSync(result.generated.find((path) => path.endsWith('.seed.ts')), 'utf8')
  assert.match(seed, /testCatalogs\.id/)
  assert.match(seed, /label: sql`excluded\.label`/)

  const schema = readFileSync(result.generated.find((path) => path.endsWith('.schema.ts')), 'utf8')
  assert.match(schema, /import \{ defineEntitySchema \} from '@\/framework\/hono'/)
  assert.match(schema, /export const testCatalogsSchema = defineEntitySchema\(rpc\['test-catalog'\], testCatalog\)/)
})

test('generates different field lists for each resource action', () => {
  const value = config()
  value.fields.push({ key: 'category', type: 'text', label: 'Category', required: true, renderer: 'text' })
  value.actionFields = {
    list: ['label', 'enabled'],
    detail: ['label'],
    create: ['category', 'label', 'enabled'],
    update: ['category', 'label', 'enabled'],
  }
  const setup = workspace(value)
  const result = JSON.parse(execute(['--config', setup.configPath, '--json'], { root: setup.outputRoot, cwd: setup.directory }))
  const resource = readFileSync(result.generated.find((path) => path.endsWith('.resource.ts')), 'utf8')
  const resourceSpec = readFileSync(result.generated.find((path) => path.endsWith('.resource.spec.ts')), 'utf8')

  assert.match(resource, /fields: \[fields\.label, fields\.enabled\]/)
  assert.match(resource, /fields: \[fields\.label\]/)
  assert.match(resource, /fields: \[fields\.category, fields\.label, fields\.enabled\]/)
  assert.ok(resourceSpec.includes('toEqual(["label","enabled"])'))
  assert.ok(resourceSpec.includes('toEqual(["label"])'))
  assert.ok(resourceSpec.includes('toEqual(["category","label","enabled"])'))
})

test('generates bounded numeric fields', () => {
  const value = config()
  value.fields.push({ key: 'rank', type: 'number', label: 'Rank', required: true, renderer: 'number', default: 1 })
  const setup = workspace(value)
  const result = JSON.parse(execute(['--config', setup.configPath, '--json'], { root: setup.outputRoot, cwd: setup.directory }))
  const entity = readFileSync(result.generated.find((path) => path.endsWith('.entity.ts')), 'utf8')
  const resource = readFileSync(result.generated.find((path) => path.endsWith('.resource.ts')), 'utf8')
  assert.match(entity, /rank: doublePrecision\('rank'\)\.notNull\(\)\.default\(1\)/)
  assert.match(resource, /rank: \{ label: 'Rank', form: \{ renderer: 'number'/)
})

test('human output lists generated and manual absolute paths', () => {
  const setup = workspace(config())
  const output = execute(['--config', setup.configPath], { root: setup.outputRoot, cwd: setup.directory })
  assert.match(output, /Generated files:/)
  assert.match(output, /Integration files:/)
  assert.match(output, /Manual files:/)
  assert.match(output, /Routes:/)
  assert.match(output, /Permissions:/)
  assert.match(output, new RegExp(`${setup.outputRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*test-catalog\\.entity\\.ts`))
})

test('does not generate a seed file when seed metadata is absent', () => {
  const value = config()
  delete value.seed
  const setup = workspace(value)
  const result = JSON.parse(execute(['--config', setup.configPath, '--json'], { root: setup.outputRoot, cwd: setup.directory }))

  assert.ok(!result.generated.some((path) => path.endsWith('.seed.ts')))
  assert.ok(!result.integration.some((path) => path.endsWith('/apps/api/scripts/seed.ts')))
})

test('refuses to overwrite existing generated output', () => {
  const setup = workspace(config())
  const entityPath = join(setup.outputRoot, 'apps/api/src/routes/test-catalog/test-catalog.entity.ts')
  mkdirSync(join(setup.outputRoot, 'apps/api/src/routes/test-catalog'), { recursive: true })
  writeFileSync(entityPath, 'keep this file')

  assert.throws(
    () => execute(['--config', setup.configPath, '--json'], { root: setup.outputRoot, cwd: setup.directory }),
    /Refusing to overwrite existing generated file/,
  )
  assert.equal(readFileSync(entityPath, 'utf8'), 'keep this file')
})

test('rejects missing metadata, duplicate keys, and unsupported types', () => {
  const cases = [
    ['missing title', (value) => { delete value.title }, /title is required/],
    ['missing kind', (value) => { delete value.kind }, /kind must be bounded-module/],
    ['missing labels', (value) => { delete value.labels }, /labels is required/],
    ['duplicate keys', (value) => { value.fields[1].key = value.fields[0].key }, /Field keys.*unique/],
    ['unsupported type', (value) => { value.fields[0].type = 'date' }, /unsupported/],
    ['unknown action field', (value) => { value.actionFields = { list: ['missing'] } }, /actionFields\.list contains unsupported field/],
  ]

  for (const [, mutate, error] of cases) {
    const value = config()
    mutate(value)
    const setup = workspace(value)
    assert.throws(() => execute(['--config', setup.configPath], { root: setup.outputRoot, cwd: setup.directory }), error)
  }
})
