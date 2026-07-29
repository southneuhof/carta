import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Guards the migration: application code composes routes from resources, view
 * shells, and cores. The retired CRUD orchestration must not come back, and no
 * screen may reach for the legacy model-config vocabulary again.
 */
const appRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

const forbiddenImports = [
  'components/composites/CRUDComposite.vue',
  'components/composites/CRUD/',
  'adapters/crud-operations',
  'adapters/crudOperations',
  '@southneuhof/is-vue-framework/model-config',
  'components/composites/Form.vue',
  'components/composites/Table.vue',
  'components/composites/Detail.vue',
  'runtimeDefaults',
  'adapters/defaults',
]

const forbiddenIdentifiers = [
  'CRUDComposite', 'useCRUDOperations', 'resolveCRUDOperations', 'FrameworkCRUDRuntime',
  'FrameworkDefaultsInput', 'FrameworkRuntime', 'useFrameworkDefaults',
  'useFrameworkRuntime', 'mergeModelConfig', 'ModelConfig', 'InputConfig',
  'fieldsAlias', 'fieldsProxy', 'fieldsParse', 'fieldsType', 'inputConfig',
]

function collectFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    if (entry === 'node_modules' || entry === 'assets') return []
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return collectFiles(path)
    return /\.(ts|vue)$/.test(path) ? [path] : []
  })
}

describe('legacy CRUD boundary', () => {
  const files = collectFiles(appRoot).filter((file) => !file.endsWith('legacy-boundary.spec.ts'))

  it('has no application import of a retired CRUD module', () => {
    const offenders = files.flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return forbiddenImports
        .filter((specifier) => source.includes(specifier))
        .map((specifier) => `${relative(appRoot, file)}: ${specifier}`)
    })

    expect(offenders).toEqual([])
  })

  it('references no retired CRUD identifier outside the legacy URL redirects', () => {
    const offenders = files.flatMap((file) => {
      if (file.includes('legacy-urls')) return []
      const source = readFileSync(file, 'utf8')
      return forbiddenIdentifiers
        .filter((identifier) => source.includes(identifier))
        .map((identifier) => `${relative(appRoot, file)}: ${identifier}`)
    })

    expect(offenders).toEqual([])
  })

  it('switches screens by route, never by a query-state view parameter', () => {
    const offenders = files
      .filter((file) => file.includes(`routes${'/'}`))
      .filter((file) => /_view['"\]`]/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(appRoot, file))

    expect(offenders).toEqual([])
  })
})
