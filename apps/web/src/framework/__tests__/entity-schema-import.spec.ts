import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromZod, requiredSchemaKeys } from '@southneuhof/is-vue-framework'
import { role } from '@southneuhof/api/routes/roles/roles.entity'

/**
 * Guards the browser-safe entity boundary.
 *
 * The API entity modules own the authoritative Zod schemas, and the browser now
 * imports them directly instead of validating against a re-declared copy. That
 * only works while the modules stay free of server-only runtime dependencies —
 * a `node:crypto` import for `randomUUID` was the original blocker, and the
 * global `crypto.randomUUID` replaced it.
 *
 * The static scan at the bottom is the real guard. Vitest runs jsdom on Node, so
 * a reintroduced `node:crypto` would still resolve here and the import
 * assertions would keep passing — only the scan fails on it, and only the scan
 * covers entity modules this suite does not itself import. The assertions above
 * prove the complementary half: that the schemas are usable client-side through
 * the ordinary validation bridge, not merely importable.
 */
const entityDirectory = join(dirname(fileURLToPath(import.meta.url)), '../../../../api/src/routes')

function collectEntityModules(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return collectEntityModules(path)
    return path.endsWith('.entity.ts') ? [path] : []
  })
}

describe('entity schemas are importable in the browser', () => {
  it('exposes the authoritative role schemas as usable validators', () => {
    const create = fromZod<{ name: string }>(role.schemas.create)

    expect(create.validate({ name: 'Admin' })).toEqual({ success: true, data: { name: 'Admin' } })
  })

  it('rejects an empty draft with an issue on the required field', () => {
    const result = fromZod(role.schemas.create).validate({})

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.issues.map((issue) => issue.path.join('.'))).toContain('name')
  })

  it('reports required keys for the hidden-but-required diagnostic', () => {
    expect(requiredSchemaKeys(role.schemas.create)).toContain('name')
  })

  it('treats every update field as optional, matching the server schema', () => {
    expect(requiredSchemaKeys(role.schemas.update)).toEqual([])
    expect(fromZod(role.schemas.update).validate({}).success).toBe(true)
  })

  it('keeps every entity module free of node builtins', () => {
    const modules = collectEntityModules(entityDirectory)
    expect(modules.length).toBeGreaterThan(0)

    const offenders = modules.filter((path) => /from '(node:|fs|path|crypto|os)'/.test(readFileSync(path, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('keeps every entity module off the Hono-carrying sprindle model subpath', () => {
    const offenders = collectEntityModules(entityDirectory).filter((path) => readFileSync(path, 'utf8').includes('@southneuhof/sprindle/model'))
    expect(offenders).toEqual([])
  })
})
