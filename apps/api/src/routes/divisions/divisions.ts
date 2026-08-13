import { authenticated, create, defineRoute, deleteRoute, detail, update } from '@southneuhof/sprindle/routes'
import { unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, desc, eq, exists, getTableColumns, ilike, inArray, or, type SQL } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { coerceBooleanQuery, ownerListProjectScope, parseOwnerListPermission } from '../../owner-list'
import { businessCategories } from '../business-categories/business-categories.entity'
import { projects } from '../projects/projects.entity'
import { divisionRelations, divisions, division } from './divisions.entity'

const divisionColumns = getTableColumns(divisions) as Record<string, unknown>
const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order', 'permission'])

async function validateDivision(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    if (typeof input.code === 'string') input.code = input.code.trim()
    if ('code' in input && input.code === '') return 'code is required.'
    if (typeof input.businessCategoryId === 'string') {
      const parent = (await getDb().select({ active: businessCategories.active }).from(businessCategories).where(eq(businessCategories.id, input.businessCategoryId)).limit(1))[0]
      if (!parent) return 'Business category not found.'
      if (!parent.active) return 'Inactive business category cannot receive an active division.'
    }
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: projects.id }).from(projects).where(eq(projects.divisionId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity
}

function listWhere(query: Record<string, unknown>, userId: string) {
  const filters: SQL[] = []
  for (const [key, value] of Object.entries(query)) {
    if (reservedQueryKeys.has(key) || value === undefined) continue
    const column = divisionColumns[key]
    if (!column) throw validationError(`Unknown query parameter "${key}".`)
    filters.push(eq(column as never, value as never))
  }
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  const permission = parseOwnerListPermission(query)
  const conditions = [
    ...filters,
    ...(search ? [or(ilike(divisions.code, search), ilike(divisions.name, search), ilike(divisions.description, search))] : []),
    ...(permission ? [exists(getDb().select({ id: projects.id }).from(projects).where(and(
      eq(projects.divisionId, divisions.id),
      inArray(projects.id, ownerListProjectScope(userId, query)),
    )))] : []),
  ]
  return conditions.length ? and(...conditions) : undefined
}

function orderBy(query: Record<string, unknown>) {
  if (!query.sort) return [asc(divisions.name)]
  const column = divisionColumns[String(query.sort)]
  if (!column) throw validationError(`Unknown sort column "${query.sort}".`)
  return [query.order === 'desc' ? desc(column as never) : asc(column as never)]
}

export const divisionList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: [authenticated(), requirePermission('list-divisions')],
  action: async (args) => {
    const identity = await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    coerceBooleanQuery(query, 'active')
    const where = listWhere(query, identity.userId)
    const page = Number(query.page)
    const limit = Number(query.limit)
    const db = getDb()
    const [rows, totalRows] = await Promise.all([
      db.select({ division: divisions, businessCategory: businessCategories }).from(divisions).leftJoin(businessCategories, eq(businessCategories.id, divisions.businessCategoryId)).where(where).orderBy(...orderBy(query)).limit(limit).offset((page - 1) * limit),
      db.select({ value: count() }).from(divisions).where(where),
    ])
    return args.c.json({
      data: rows.map(({ division: row, businessCategory }) => division.schemas.select.parse({ ...row, businessCategory })),
      page,
      limit,
      total: Number(totalRows[0]?.value ?? 0),
    })
  },
})

export const domain = defineDomainPart({ tables: { divisions }, entities: [division], relations: [divisionRelations] })

export const divisionModel = defineModel({
  path: '/divisions',
  entity: division,
  routes: {
    list: divisionList,
    detail: detail({ authorize: [authenticated(), requirePermission('detail-divisions')] }),
    create: create({ authorize: [authenticated(), requirePermission('create-divisions')] }),
    update: update({ authorize: [authenticated(), requirePermission('update-divisions')] }),
    delete: deleteRoute({ authorize: [authenticated(), requirePermission('delete-divisions')] }),
  },
  validate: async ({ route, state }) => validateDivision(route.kind, state as { input?: unknown; id?: string }),
})
