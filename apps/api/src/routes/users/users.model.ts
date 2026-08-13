import { authenticated, defineRoute, detail } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { validationError } from '@southneuhof/sprindle'
import { and, asc, countDistinct, desc, eq, getTableColumns, ilike, or, type SQL } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { projectRoleAssignments, roles } from '../roles/roles.entity'
import { projects } from '../projects/projects.entity'
import { sessions } from '../auth/auth.entity'
import { user, users } from './users.entity'

const userColumns = getTableColumns(users) as Record<string, unknown>
const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order', 'projectId'])

function listWhere(query: Record<string, unknown>) {
  const filters: SQL[] = []
  for (const [key, value] of Object.entries(query)) {
    if (reservedQueryKeys.has(key) || value === undefined) continue
    const column = userColumns[key]
    if (!column) throw validationError(`Unknown query parameter "${key}".`)
    filters.push(eq(column as never, value as never))
  }
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  const projectId = typeof query.projectId === 'string' && query.projectId ? query.projectId : undefined
  const conditions = [
    ...filters,
    ...(search ? [or(ilike(users.name, search), ilike(users.email, search), ilike(users.username, search))] : []),
  ]
  if (projectId) {
    conditions.push(
      eq(projectRoleAssignments.active, true),
      eq(roles.active, true),
      eq(roles.realm, 'project'),
      eq(projects.id, projectId),
      or(
        eq(projectRoleAssignments.coverageType, 'all_projects'),
        and(eq(projectRoleAssignments.coverageType, 'division'), eq(projectRoleAssignments.divisionId, projects.divisionId)),
        and(eq(projectRoleAssignments.coverageType, 'project'), eq(projectRoleAssignments.projectId, projectId)),
      )!,
    )
  }
  return conditions.length ? and(...conditions) : undefined
}

function orderBy(query: Record<string, unknown>) {
  if (!query.sort) return [asc(users.name)]
  const column = userColumns[String(query.sort)]
  if (!column) throw validationError(`Unknown sort column "${query.sort}".`)
  return [query.order === 'desc' ? desc(column as never) : asc(column as never)]
}

export const userList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: [authenticated(), requirePermission('list-users')],
  action: async (args) => {
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const where = listWhere(query)
    const page = Number(query.page)
    const limit = Number(query.limit)
    const projectId = typeof query.projectId === 'string' && query.projectId ? query.projectId : undefined
    const db = getDb()
    const base = db.selectDistinct({ user: users }).from(users)
    const scoped = projectId
      ? base.innerJoin(projectRoleAssignments, eq(projectRoleAssignments.userId, users.id)).innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId)).innerJoin(projects, eq(projects.id, projectId))
      : base
    const countBase = db.select({ value: countDistinct(users.id) }).from(users)
    const countScoped = projectId
      ? countBase.innerJoin(projectRoleAssignments, eq(projectRoleAssignments.userId, users.id)).innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId)).innerJoin(projects, eq(projects.id, projectId))
      : countBase
    const [rows, totalRows] = await Promise.all([
      scoped.where(where).orderBy(...orderBy(query)).limit(limit).offset((page - 1) * limit),
      countScoped.where(where),
    ])
    return args.c.json({
      data: rows.map(({ user: row }) => user.schemas.select.parse(row)),
      page,
      limit,
      total: Number(totalRows[0]?.value ?? 0),
    })
  },
})

const updateUser = defineRoute({
  path: '/:id',
  method: 'patch',
  kind: 'update',
  authorize: [authenticated(), requirePermission('update-users')],
  action: async ({ c }) => {
    const id = c.req.param('id') ?? ''
    if (!id) return c.json({ error: 'not_found' }, 404)
    const found = (await getDb().select().from(users).where(eq(users.id, id)).limit(1))[0]
    if (!found) return c.json({ error: 'not_found' }, 404)
    const input = user.schemas.update.parse(await c.req.json().catch(() => ({})))
    const updated = await getDb().transaction(async (tx) => {
      const saved = await tx.update(users).set(input).where(eq(users.id, id)).returning()
      if (found.statusCode === 'active' && input.statusCode && input.statusCode !== 'active') {
        await tx.delete(sessions).where(eq(sessions.userId, id))
      }
      return saved[0]
    })
    return c.json({ data: updated })
  },
})

export const userModel = defineModel({
  path: '/users',
  entity: user,
  routes: {
    list: userList,
    detail: detail({ authorize: [authenticated(), requirePermission('detail-users')] }),
    update: updateUser,
  },
})
