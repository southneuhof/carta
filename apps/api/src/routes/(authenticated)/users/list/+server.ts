import { list } from '@southneuhof/sprindle'
import { and, asc, countDistinct, getTableColumns } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { equalityFilters, orderClause, searchCondition } from '../../../../list-query'
import { user, users } from '../users.entity'

const userColumns = getTableColumns(users) as Record<string, unknown>
const userReservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order'])

function listWhere(query: Record<string, unknown>) {
  const search = searchCondition(query, userColumns, ['name', 'email'])
  const conditions = [
    ...equalityFilters(query, userColumns, { reservedKeys: userReservedQueryKeys }),
    ...(search ? [search] : []),
  ]
  return conditions.length ? and(...conditions) : undefined
}

export const GET = list({
  authorize: requirePermission('list-users'),
  run: async (args) => {
    const query = args.state.query
    const where = listWhere(query)
    const page = Number(query.page)
    const limit = Number(query.limit)
    const db = getDb()
    const [rows, totalRows] = await Promise.all([
      db.selectDistinct({ user: users }).from(users).where(where).orderBy(...orderClause(query, userColumns, [asc(users.name)])).limit(limit).offset((page - 1) * limit),
      db.select({ value: countDistinct(users.id) }).from(users).where(where),
    ])
    return {
      data: rows.map(({ user: row }) => user.schemas.select.parse(row)),
      total: Number(totalRows[0]?.value ?? 0),
    }
  },
})
