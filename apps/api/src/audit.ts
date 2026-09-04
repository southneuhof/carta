import { getTableColumns } from 'drizzle-orm'
import type { DataWriteHook } from '@southneuhof/sprindle/hono'
import type { OrgIdentity } from './identity'
import { requireOrgIdentity } from './identity'

/**
 * Server-owned audit stamps for canonical create and update routes.
 */
export function auditStamp(): DataWriteHook {
  return async ({ c, context, identity, operation }) => {
    const orgIdentity = await requireOrgIdentity({ c, identity })
    const columns = context.entity.table ? (getTableColumns(context.entity.table as never) as Record<string, unknown>) : {}
    return auditValues(orgIdentity, operation, columns)
  }
}

function auditValues(identity: OrgIdentity, operation: 'create' | 'update', columns: Record<string, unknown>): Record<string, unknown> {
  const has = (key: string) => key in columns
  const timestamp = new Date().toISOString()
  const values: Record<string, unknown> = {}
  if (has('updatedByUserId')) values.updatedByUserId = identity.userId
  if (has('updatedAt')) values.updatedAt = timestamp
  if (operation === 'create') {
    if (has('createdByUserId')) values.createdByUserId = identity.userId
    if (has('createdAt')) values.createdAt = timestamp
  }
  return values
}
