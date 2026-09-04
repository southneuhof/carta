import { detail, list, update } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { and, asc, countDistinct, eq, getTableColumns } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { equalityFilters, orderClause, searchCondition } from '../../list-query'
import { sessions } from '../auth/auth.entity'
import { user, users, userPublicSchema } from './users.entity'
import { createUser } from './users.routes'
import { storedAssetModel } from '../../storage/assets'

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

export const userList = list({
  authorize: [requirePermission('list-users')],
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

const updateUser = update({
  authorize: [requirePermission('update-users')],
  run: async ({ state }) => {
    const id = state.id
    const found = (await getDb().select().from(users).where(eq(users.id, id)).limit(1))[0]
    if (!found) return undefined
    const input = user.schemas.update.parse(state.input)
    const updated = await getDb().transaction(async (tx) => {
      const saved = await tx.update(users).set({ ...input, ...(state.values ?? {}) }).where(eq(users.id, id)).returning()
      if (found.statusCode === 'active' && input.statusCode && input.statusCode !== 'active') {
        await tx.delete(sessions).where(eq(sessions.userId, id))
      }
      return saved[0]
    })
    return updated
  },
})

export const userModel = defineModel({
  path: '/users',
  entity: user,
  enrich: storedAssetModel(userPublicSchema),
  routes: {
    list: userList,
    detail: detail({ authorize: [requirePermission('detail-users')] }),
    create: createUser,
    update: updateUser,
  },
})
