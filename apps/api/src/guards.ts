import { HttpError, notFound, validationError } from '@southneuhof/sprindle'
import type { RouteValidate } from '@southneuhof/sprindle/model'
import { eq, getTableColumns, sql, type InferSelectModel } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { getDb } from './db'

export const referencedDeleteMessage = 'Referenced records must be deactivated before delete.'

/**
 * Loads the row identified by `id` or fails with `fail()`. The default failure
 * is a bare 404; FK-style checks pass their own factory, e.g.
 * `() => validationError('User not found.')`.
 */
export async function requireExists<T extends PgTable>(
  table: T,
  id: string,
  fail: () => HttpError = notFound,
): Promise<InferSelectModel<T>> {
  const idColumn = getTableColumns(table).id as PgColumn
  const rows = await getDb().select().from(table as PgTable).where(eq(idColumn, id)).limit(1)
  if (!rows[0]) throw fail()
  return rows[0] as InferSelectModel<T>
}

export async function isReferenced(table: PgTable, childColumn: PgColumn, id: string): Promise<boolean> {
  const references = await getDb().select({ value: sql<number>`1` }).from(table).where(eq(childColumn, id)).limit(1)
  return references.length > 0
}

export async function guardNotReferenced(table: PgTable, childColumn: PgColumn, id: string): Promise<void> {
  if (await isReferenced(table, childColumn, id)) throw validationError(referencedDeleteMessage)
}

/**
 * Canonical-delete reference guard: answers the shared message when any child
 * table still references the id. Composable with a route's other validators
 * (`validate: [dispatchOtherChecks, deleteGuard([...])]`).
 */
export function deleteGuard(refs: ReadonlyArray<{ table: PgTable; fkColumn: PgColumn }>): RouteValidate {
  return async ({ state }) => {
    const id = (state as { id?: unknown }).id
    if (id == null) return undefined
    for (const { table, fkColumn } of refs) {
      if (await isReferenced(table, fkColumn, String(id))) return referencedDeleteMessage
    }
    return undefined
  }
}
