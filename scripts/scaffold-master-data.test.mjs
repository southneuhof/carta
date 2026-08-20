import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { test } from 'node:test'
import { execute } from './scaffold-master-data.mjs'

const temporaryDirectories = []

function workspace(config) {
  const directory = mkdtempSync(join(tmpdir(), 'scaffold-master-data-'))
  temporaryDirectories.push(directory)
  const configPath = join(directory, 'config.json')
  const outputRoot = join(directory, 'repository')
  writeFileSync(configPath, JSON.stringify(config, null, 2))
  return { directory, configPath, outputRoot }
}

function config() {
  return {
    kind: 'simple-master-data',
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
    navigation: {
      after: 'master-data-number-configs',
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
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/[testCatalogId]/detail.route.vue',
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/[testCatalogId]/edit.route.vue',
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/create.route.vue',
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/index.route.vue',
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/test-catalog.integration.spec.ts',
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/test-catalog.resource.spec.ts',
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/test-catalog.resource.ts',
    'apps/web/src/routes/(authenticated)/master-data/test-catalog/test-catalog.schema.ts',
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
  assert.ok(result.integration.some((path) => path.endsWith('/apps/web/src/routes/(authenticated)/master-data/index.route.vue')))
  assert.equal(result.manual.length, 1)
  assert.ok(result.manual.some((path) => path.endsWith('/apps/web/src/route-map.d.ts')))
  assert.equal(result.routes.list, 'master-data-test-catalog')
  assert.equal(result.permissions.view, 'view-test-catalog')

  const entity = readFileSync(result.generated.find((path) => path.endsWith('.entity.ts')), 'utf8')
  assert.match(entity, /label: text\('label'\)/)
  assert.match(entity, /enabled: boolean\('enabled'\)/)
  assert.doesNotMatch(entity, /\b(name|description|active)\s*:/)
  assert.doesNotMatch(entity, /auditFields/)

  const createRoute = readFileSync(result.generated.find((path) => path.endsWith('/create.route.vue')), 'utf8')
  assert.match(createRoute, /title="Add Test Catalog"/)
  assert.match(createRoute, /submit-label="Submit"/)
  assert.match(createRoute, /successMessage: 'Created test catalog\.'/)

  const editRoute = readFileSync(result.generated.find((path) => path.endsWith('/edit.route.vue')), 'utf8')
  assert.match(editRoute, /title="Edit Test Catalog"/)
  assert.match(editRoute, /successMessage: 'Updated test catalog\.'/)

  const seed = readFileSync(result.generated.find((path) => path.endsWith('.seed.ts')), 'utf8')
  assert.match(seed, /testCatalogs\.id/)
  assert.match(seed, /label: sql`excluded\.label`/)
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
    ['missing kind', (value) => { delete value.kind }, /kind must be simple-master-data/],
    ['missing labels', (value) => { delete value.labels }, /labels is required/],
    ['duplicate keys', (value) => { value.fields[1].key = value.fields[0].key }, /Field keys.*unique/],
    ['unsupported type', (value) => { value.fields[0].type = 'number' }, /unsupported/],
    ['unknown action field', (value) => { value.actionFields = { list: ['missing'] } }, /actionFields\.list contains unsupported field/],
  ]

  for (const [, mutate, error] of cases) {
    const value = config()
    mutate(value)
    const setup = workspace(value)
    assert.throws(() => execute(['--config', setup.configPath], { root: setup.outputRoot, cwd: setup.directory }), error)
  }
})
