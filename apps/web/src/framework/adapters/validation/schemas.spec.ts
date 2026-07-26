import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { schemaAdapter } from './schemas'

const contractsSchemaRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../../../../packages/contracts/src/schemas')

const forbiddenImports = ['node:', 'pg', 'drizzle-orm', 'drizzle-zod', 'better-auth', '@southneuhof/api', '@southneuhof/sprindle']

function collectFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return collectFiles(path)
    return path.endsWith('.ts') ? [path] : []
  })
}

function importedSpecifiers(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  return [...source.matchAll(/(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)].map((match) => match[1])
}

describe('browser boundary', () => {
  it('keeps the schema manifest free of server, database, and Node imports', () => {
    const offenders = collectFiles(contractsSchemaRoot).flatMap((file) =>
      importedSpecifiers(file)
        .filter((specifier) => forbiddenImports.some((forbidden) => specifier === forbidden || specifier.startsWith(`${forbidden}/`) || specifier.startsWith('node:')))
        .map((specifier) => `${file}: ${specifier}`)
    )

    expect(offenders).toEqual([])
  })
})

describe('project schema adapter', () => {
  it('resolves distinct create and update schemas', () => {
    const create = schemaAdapter.find('users', 'create')
    const update = schemaAdapter.find('users', 'update')

    expect(create?.validate({ name: 'Admin', email: 'admin@example.test', roleId: 'role-1' }).success).toBe(true)
    expect(create?.validate({ name: 'Admin' }).success).toBe(false)
    expect(update?.validate({ name: 'Admin' }).success).toBe(true)
  })

  it('resolves role schemas', () => {
    expect(schemaAdapter.find('roles', 'create')?.validate({ name: 'Editor' }).success).toBe(true)
    expect(schemaAdapter.find('roles', 'create')?.validate({}).success).toBe(false)
  })

  it('returns undefined for resources or operations without metadata', () => {
    expect(schemaAdapter.find('incidents', 'create')).toBeUndefined()
    expect(schemaAdapter.find('roles', 'record')).toBeDefined()
  })
})
