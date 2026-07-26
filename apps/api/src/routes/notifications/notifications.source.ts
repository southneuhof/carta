import type { ModelSource, SourceListResult } from '@southneuhof/sprindle/source'
import type { OrgIdentity } from '../../identity'
import { notification } from './notifications.entity'

/**
 * The key the model's `before` hook uses to hand the caller's identity to this
 * source through the list query.
 *
 * **Why this shape.** `ModelSource.list` receives `{ query, context }` and nothing
 * else. `context` is the *model* runtime context built once by `defineModel` and
 * shared by every request, so it cannot carry per-request identity. The only
 * per-request value that reaches a source is the query object that `list()` builds
 * from `state`, and `state` is exactly what a `before` hook may patch — see
 * `runBefore` in `packages/sprindle/src/routes/pipeline.ts`, which does
 * `Object.assign(args.state, patch)`.
 *
 * So the answer to "can a custom ModelSource express a caller-scoped list" is yes,
 * via the documented `before` seam, with no framework change. It is option 1 from
 * plan 023 Step 4. Option 2 — a hand-written list route — was not needed.
 *
 * A client cannot forge this: the hook assigns it unconditionally after `state` is
 * computed, so any inbound value of the same name is overwritten before the source
 * ever sees it.
 */
export const SCOPE_KEY = '__orgScope'

export type ScopedListQuery = Record<string, unknown> & { [SCOPE_KEY]?: OrgIdentity | null }

const WINDOW_DAYS = 30

/** Scopes that see every section. Anything narrower is confined to its own. */
const CROSS_SECTION_SCOPES = new Set(['all', 'central'])

function windowStart(): string {
  return new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * The predicate from `GetTotalNotification.php` and `customFieldFilterable`:
 * the caller must be one of the row's targets, the row must be in their section
 * unless their scope is cross-section, and it must be inside the 30-day window.
 *
 * A caller with no employee row and no roles matches nothing. That is deliberate
 * and load-bearing — an empty target list must mean "sees nothing", never "sees
 * everything", or one unplaced account reads every section's notifications.
 */
export function scopeConditions(identity: OrgIdentity | null | undefined): Record<string, unknown>[] {
  const targets: Record<string, unknown>[] = []
  if (identity?.employeeId) targets.push({ recipientEmployeeId: identity.employeeId })
  if (identity?.jobPositionId) targets.push({ jobPositionId: identity.jobPositionId })
  if (identity?.roleIds.length) targets.push({ roleId: { in: identity.roleIds } })

  // No targets: an impossible predicate, not an absent one.
  if (targets.length === 0) return [{ id: { isNull: true } }]

  const conditions: Record<string, unknown>[] = [{ OR: targets }, { createdAt: { gte: windowStart() } }]
  if (!CROSS_SECTION_SCOPES.has(identity?.scope ?? '')) {
    conditions.push({ sectionId: identity?.sectionId ?? null })
  }
  return conditions
}

type RelationalReader = {
  findMany: (config?: unknown) => Promise<unknown[]>
}

type ScopedDb = {
  query: Record<string, RelationalReader>
}

const RESERVED = new Set(['page', 'limit', 'search', 'sort', 'order', SCOPE_KEY])

const SEARCHABLE = ['title', 'content'] as const

/**
 * Wraps the bound Drizzle source and narrows `list` to the caller. Everything else
 * delegates unchanged — only reads need scoping, and this model exposes no writes.
 *
 * `getSource` is called per request rather than captured, because
 * `bindDomainDatabase` replaces `entity.source` on every `getDb()`.
 */
export function createScopedNotificationSource(getDb: () => unknown): ModelSource {
  const wrapped = () => notification.source

  return {
    async list({ query }): Promise<SourceListResult<unknown>> {
      const scoped = (query ?? {}) as ScopedListQuery
      const identity = scoped[SCOPE_KEY]

      const page = Math.max(1, Number(scoped.page) || 1)
      const limit = Math.max(1, Number(scoped.limit) || 20)
      const search = typeof scoped.search === 'string' && scoped.search ? scoped.search : undefined
      const order = scoped.order === 'desc' ? 'desc' : 'asc'
      const sort = typeof scoped.sort === 'string' && scoped.sort ? scoped.sort : 'createdAt'

      const conditions = [...scopeConditions(identity)]
      for (const [key, value] of Object.entries(scoped)) {
        if (RESERVED.has(key) || value === undefined) continue
        conditions.push({ [key]: value })
      }
      if (search) conditions.push({ OR: SEARCHABLE.map((column) => ({ [column]: { ilike: `%${search}%` } })) })

      const where = { AND: conditions }
      const db = getDb() as ScopedDb
      const [rows, matching] = await Promise.all([
        db.query.notifications.findMany({
          where,
          orderBy: { [sort]: order },
          limit,
          offset: (page - 1) * limit,
          with: { jobPosition: true, role: true, section: true },
        }),
        // The relational reader has no aggregate form in this Drizzle version, so
        // `total` counts an id-only projection over the same predicate. The 30-day
        // window bounds it; if that window ever widens, this needs a real count.
        db.query.notifications.findMany({ where, columns: { id: true } }),
      ])

      return { data: rows.map((row) => notification.schemas.select.parse(row)), total: matching.length }
    },
    detail: (args) => wrapped().detail(args),
    create: (args) => wrapped().create(args),
    update: (args) => wrapped().update(args),
    delete: (args) => wrapped().delete(args),
    materialize: (input, args) => wrapped().materialize(input, args),
  }
}
