import type { ModelSource, SourceListResult } from '@southneuhof/sprindle/source'
import { HttpError } from '@southneuhof/sprindle'
import type { OrgIdentity } from '../../identity'
import { overtime, overtimeStatuses } from './overtimes.entity'

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
const FILTERS = new Set(['sectionId', 'applicantEmployeeId', 'startDate', 'endDate', 'jobPositionId', 'statusCode'])
const SEARCHABLE = ['description'] as const

type OvertimeFilters = {
  sectionId?: string
  applicantEmployeeId?: string
  startDate?: string
  endDate?: string
  jobPositionId?: string
  statusCode?: (typeof overtimeStatuses)[number]
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

export function parseOvertimeFilters(query: Record<string, unknown>): OvertimeFilters {
  const result: OvertimeFilters = {}
  for (const [key, raw] of Object.entries(query)) {
    if (RESERVED.has(key)) continue
    if (!FILTERS.has(key)) throw new HttpError(400, 'invalid_filter', `Unknown overtime filter: ${key}`)
    if (raw === '' || raw === undefined || raw === null) continue
    if (typeof raw !== 'string') throw new HttpError(400, 'invalid_filter', `${key} must be a string`)
    if ((key === 'startDate' || key === 'endDate') && !DATE.test(raw)) {
      throw new HttpError(400, 'invalid_filter', `${key} must use YYYY-MM-DD`)
    }
    if (key === 'statusCode' && !overtimeStatuses.includes(raw as never)) {
      throw new HttpError(400, 'invalid_filter', `Unknown overtime status: ${raw}`)
    }
    Object.assign(result, { [key]: raw })
  }
  if (result.startDate && result.endDate && result.startDate > result.endDate) {
    throw new HttpError(400, 'invalid_filter', 'startDate must not be after endDate')
  }
  return result
}

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

      const db = getDb() as ScopedDb
      const conditions = [...scopeConditions(scoped[SCOPE_KEY])]
      const filters = parseOvertimeFilters(scoped)
      if (filters.sectionId) conditions.push({ sectionId: filters.sectionId })
      if (filters.applicantEmployeeId) conditions.push({ applicantEmployeeId: filters.applicantEmployeeId })
      if (filters.statusCode) conditions.push({ statusCode: filters.statusCode })
      if (filters.startDate) conditions.push({ date: { gte: filters.startDate } })
      if (filters.endDate) conditions.push({ date: { lte: filters.endDate } })
      if (filters.jobPositionId) {
        const employees = await db.query.employees.findMany({
          where: { jobPositionId: filters.jobPositionId },
          columns: { id: true },
        }) as { id: string }[]
        conditions.push({ applicantEmployeeId: { in: employees.map(({ id }) => id) } })
      }
      if (search) conditions.push({ OR: SEARCHABLE.map((column) => ({ [column]: { ilike: `%${search}%` } })) })

      const where = conditions.length ? { AND: conditions } : undefined
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
