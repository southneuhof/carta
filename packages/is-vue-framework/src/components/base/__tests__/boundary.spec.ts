import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const baseRoot = join(__dirname, '..')
const sourceRoot = join(baseRoot, '..', '..')
const forbiddenImports = [
  ['@southneuhof/is-vue-framework', 'adapters'].join('/'),
  ['@southneuhof/is-vue-framework', 'behaviors'].join('/'),
  ['@southneuhof/is-vue-framework', 'services'].join('/'),
  ['@southneuhof/is-vue-framework', 'router'].join('/'),
  ['@southneuhof/is-vue-framework', 'components', 'composites'].join('/'),
  '@southneuhof/is-data-model',
  'vue-router',
]

function collectFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return collectFiles(path)
    return /\.(ts|vue)$/.test(path) ? [path] : []
  })
}

function importedSpecifiers(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  return [...source.matchAll(/(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)].map((match) => match[1])
}

describe('base component boundary', () => {
  it('keeps base components decoupled from framework and app layers', () => {
    const offenders = collectFiles(baseRoot)
      .filter((file) => importedSpecifiers(file).some((specifier) => forbiddenImports.some((importPath) => specifier.startsWith(importPath))))
      .map((file) => relative(sourceRoot, file))

    expect(offenders).toEqual([])
  })
})
