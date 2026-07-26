import type { ModelSource, SourceListResult } from '@southneuhof/sprindle/source'
import type { OrgIdentity } from '../../identity'
import { overtime } from './overtimes.entity'

/**
 * Same mechanism as `notifications.source.ts`, and deliberately the same rather
 * than a second invention: `ModelSource.list` sees only `{ query, context }`, and
 * a model-level `before` hook patching `state.query` is the one per-request channel
 * into it. See that file for the full reasoning.
 */
export const SCOPE_KEY = '__orgScope'

type ScopedListQuery = Record<string, unknown> & { [SCOPE_KEY]?: OrgIdentity | null }

/** Scopes that read every section. Anything narrower is confined to its own. */
const CROSS_SECTION_SCOPES = new Set(['all', 'central'])

/**
 * Section scoping only. Unlike notifications there is no per-row target list: an
 * overtime request is visible to its whole section, because everyone in the chain
 * has to be able to read it.
 *
 * A caller with no section and a narrow scope matches nothing. Default-deny is the
 * point — an unplaced account must not fall through to reading every section.
 */
export function scopeConditions(identity: OrgIdentity | null | undefined): Record<string, unknown>[] {
  if (CROSS_SECTION_SCOPES.has(identity?.scope ?? '')) return []
  if (!identity?.sectionId) return [{ id: { isNull: true } }]
  return [{ sectionId: identity.sectionId }]
}

type RelationalReader = { findMany: (config?: unknown) => Promise<unknown[]> }
type ScopedDb = { query: Record<string, RelationalReader> }

const RESERVED = new Set(['page', 'limit', 'search', 'sort', 'order', SCOPE_KEY])
const SEARCHABLE = ['description'] as const

export function createScopedOvertimeSource(getDb: () => unknown): ModelSource {
  const wrapped = () => overtime.source

  return {
    async list({ query }): Promise<SourceListResult<unknown>> {
      const scoped = (query ?? {}) as ScopedListQuery

      const page = Math.max(1, Number(scoped.page) || 1)
      const limit = Math.max(1, Number(scoped.limit) || 20)
      const search = typeof scoped.search === 'string' && scoped.search ? scoped.search : undefined
      const order = scoped.order === 'desc' ? 'desc' : 'asc'
      const sort = typeof scoped.sort === 'string' && scoped.sort ? scoped.sort : 'createdAt'

      const conditions = [...scopeConditions(scoped[SCOPE_KEY])]
      for (const [key, value] of Object.entries(scoped)) {
        if (RESERVED.has(key) || value === undefined) continue
        conditions.push({ [key]: value })
      }
      if (search) conditions.push({ OR: SEARCHABLE.map((column) => ({ [column]: { ilike: `%${search}%` } })) })

      const where = conditions.length ? { AND: conditions } : undefined
      const db = getDb() as ScopedDb
      const [rows, matching] = await Promise.all([
        db.query.overtimes.findMany({
          where,
          orderBy: { [sort]: order },
          limit,
          offset: (page - 1) * limit,
          with: { applicant: true, section: true },
        }),
        db.query.overtimes.findMany({ where, columns: { id: true } }),
      ])

      return { data: rows.map((row) => overtime.schemas.select.parse(row)), total: matching.length }
    },
    detail: (args) => wrapped().detail(args),
    create: (args) => wrapped().create(args),
    update: (args) => wrapped().update(args),
    delete: (args) => wrapped().delete(args),
    materialize: (input, args) => wrapped().materialize(input, args),
  }
}
