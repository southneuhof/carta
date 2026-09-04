import { and, eq, getTableColumns, isNull } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { notFound } from '@southneuhof/sprindle'
import type { RouteAuthorize } from '@southneuhof/sprindle/model'
import { deleteRoute } from '@southneuhof/sprindle/routes'
import { getDb } from './db'
import { requireOrgIdentity } from './identity'

type SoftDeleteTable = PgTable & {
  id: PgColumn
  deletedAt: PgColumn
  deletedByUserId: PgColumn
  deletedReason?: PgColumn
  updatedByUserId: PgColumn
  updatedAt: PgColumn
}

const DEFAULT_DELETE_REASON = 'Soft-deleted'

export function softDeleteValues(columns: Record<string, PgColumn>, userId: string, reason?: string): Record<string, unknown> {
  const timestamp = new Date().toISOString()
  const values: Record<string, unknown> = {
    deletedByUserId: userId,
    deletedAt: timestamp,
    updatedByUserId: userId,
    updatedAt: timestamp,
  }
  if (columns.deletedReason) values.deletedReason = reason ?? DEFAULT_DELETE_REASON
  return values
}

/**
 * Soft delete as a canonical delete route. Flags `deleted=true` on the parent
 * row (0 matched rows -> 404), then applies the identical flag update to every
 * cascade child inside the same transaction; a child with zero rows is fine.
 * Writes go through `getDb()` because the source's delete hard-deletes.
 */
export function softDeleteRoute(options: {
  table: SoftDeleteTable
  authorize: RouteAuthorize[]
  reason?: string
  cascade?: Array<{ table: SoftDeleteTable; fkColumn: AnyColumn }>
}) {
  const columns = getTableColumns(options.table) as unknown as Record<string, PgColumn>
  return deleteRoute({
    authorize: options.authorize,
    run: async (args) => {
      const identity = await requireOrgIdentity(args)
      const id = args.state.id
      await getDb().transaction(async (tx) => {
        const parent = await tx
          .update(options.table)
          .set(softDeleteValues(columns, identity.userId, options.reason))
          .where(and(eq(columns.id, id), isNull(columns.deletedAt)))
          .returning({ id: columns.id })
        if (!parent[0]) throw notFound()
        for (const child of options.cascade ?? []) {
          const childColumns = getTableColumns(child.table) as unknown as Record<string, PgColumn>
          await tx
            .update(child.table)
            .set(softDeleteValues(childColumns, identity.userId, options.reason))
            .where(and(eq(child.fkColumn, id), isNull(childColumns.deletedAt)))
        }
      })
    },
  })
}
