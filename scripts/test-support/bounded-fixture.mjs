import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const ownerPaths = [
  'apps/api/src/domains.ts',
  'apps/api/src/authorization/catalog.ts',
  'apps/api/scripts/seed.ts',
  'apps/web/src/manifest/navigation.ts',
]
export function copyCurrentOwners(root) {
  for (const path of ownerPaths) {
    const destination = resolve(root, path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, readFileSync(resolve(sourceRoot, path)))
  }
}
export function boundedConfig() {
  return {
    kind: 'bounded-module', slug: 'test-catalog', table: 'test_catalog', symbol: 'TestCatalog', title: 'Test Catalog',
    identity: { key: 'id', type: 'text', primary: true, generated: 'uuid' },
    fields: [{ key: 'label', type: 'text', label: 'Label', required: true, renderer: 'text' }],
    labels: { listTitle: 'Test Catalog', detailTitle: 'Test Catalog Item', createTitle: 'Add Test Catalog', editTitle: 'Edit Test Catalog', submitLabel: 'Save' },
    permissions: { moduleName: 'Test Catalog', realm: 'system', entries: Object.fromEntries(['list', 'detail', 'create', 'update', 'delete'].map(action => [action, { name: `${action} catalog`, description: `${action} catalog entries.` }])) },
    navigation: { group: 'settings', after: 'settings-roles', title: 'Test Catalog', icon: 'folder' },
    seed: { records: [{ id: 'catalog-one', label: 'One' }], updateFields: ['label'] },
  }
}
