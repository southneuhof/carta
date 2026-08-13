import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, desc, eq, getTableColumns, ilike, inArray, or, type SQL } from 'drizzle-orm'
import { requireProjectCoverage } from '../../authorization'
import { orgIdentity, requirePermission } from '../../identity'
import { ownerAllowedOperations, ownerListProjectScope } from '../../owner-list'
import { getDb } from '../../db'
import { divisions } from '../divisions/divisions.entity'
import { workItems } from '../work-items/work-items.entity'
import { projectRelations, projects, project } from './projects.entity'

const projectColumns = getTableColumns(projects) as Record<string, unknown>
const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order', 'permission'])
const projectOperations = { detail: 'detail-projects', update: 'update-projects', delete: 'delete-projects' } as const

export function normalizeProjectListQuery(query: Record<string, unknown>) {
  const implementationStatusCode = query.implementationStatusCode
  if (implementationStatusCode !== undefined) {
    if (!['on-progress', 'finished', 'draft'].includes(String(implementationStatusCode))) {
      throw validationError('Unsupported implementationStatusCode.')
    }
    delete query.implementationStatusCode
    if (query.statusCode === 'completed') delete query.statusCode
    if (implementationStatusCode === 'on-progress') query.active = true
    else if (implementationStatusCode === 'finished') query.active = false
    else query.statusCode = 'draft'
  }

  if (query.active !== undefined) {
    if (query.active === 'true') query.active = true
    else if (query.active === 'false') query.active = false
    else if (typeof query.active !== 'boolean') throw validationError('active must be true or false.')
  }

  return query
}

async function validateProject(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    for (const key of ['number', 'integrationCode']) if (typeof input[key] === 'string') input[key] = input[key].trim()
    if (typeof input.shortName === 'string') input.shortName = input.shortName.trim()
    for (const key of ['number', 'integrationCode']) if (key in input && input[key] === '') return `${key} is required.`
    if (route === 'create' && (typeof input.startDate !== 'string' || input.startDate.trim() === '')) return 'startDate is required.'
    if (typeof input.divisionId === 'string') {
      const parent = (await getDb().select({ active: divisions.active }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1))[0]
      if (!parent) return 'Division not found.'
      if (!parent.active) return 'Inactive division cannot receive an active project.'
    }
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: workItems.id }).from(workItems).where(eq(workItems.projectId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity
}

function listWhere(query: Record<string, unknown>, scope: ReturnType<typeof ownerListProjectScope>) {
  const filters: SQL[] = []
  for (const [key, value] of Object.entries(query)) {
    if (reservedQueryKeys.has(key) || value === undefined) continue
    const column = projectColumns[key]
    if (!column) throw validationError(`Unknown query parameter "${key}".`)
    filters.push(eq(column as never, value as never))
  }
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  const conditions = [
    inArray(projects.id, scope),
    ...filters,
    ...(search ? [or(
      ilike(projects.number, search),
      ilike(projects.integrationCode, search),
      ilike(projects.name, search),
      ilike(projects.shortName, search),
      ilike(projects.description, search),
      ilike(projects.statusCode, search),
    )] : []),
  ]
  return and(...conditions)
}

function orderBy(query: Record<string, unknown>) {
  if (!query.sort) return [asc(projects.number)]
  const column = projectColumns[String(query.sort)]
  if (!column) throw validationError(`Unknown sort column "${query.sort}".`)
  return [query.order === 'desc' ? desc(column as never) : asc(column as never)]
}

function requiredId(args: Parameters<typeof actor>[0]) {
  const id = args.c.req.param('id')
  if (!id) throw notFound()
  return id
}

async function readProject(identity: Awaited<ReturnType<typeof actor>>, projectId: string) {
  await requireProjectCoverage(identity.userId, projectId)
  const row = (await getDb().select({ project: projects, division: divisions }).from(projects).leftJoin(divisions, eq(divisions.id, projects.divisionId)).where(eq(projects.id, projectId)).limit(1))[0]
  if (!row) throw notFound()
  return {
    ...project.schemas.select.parse({ ...row.project, division: row.division }),
    allowedOperations: ownerAllowedOperations(identity.permissions, true, projectOperations),
  }
}

export const projectList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: [authenticated(), requirePermission('list-projects')],
  action: async (args) => {
    const identity = await actor(args)
    const { c } = args
    const query = normalizeProjectListQuery(listQuerySchema.parse(c.req.query()) as Record<string, unknown>)
    const where = listWhere(query, ownerListProjectScope(identity.userId, query))
    const db = getDb()
    const page = Number(query.page)
    const limit = Number(query.limit)
    const [rows, totalRows] = await Promise.all([
      db.select({ project: projects, division: divisions }).from(projects).leftJoin(divisions, eq(divisions.id, projects.divisionId)).where(where).orderBy(...orderBy(query)).limit(limit).offset((page - 1) * limit),
      db.select({ value: count() }).from(projects).where(where),
    ])
    const allowedOperations = ownerAllowedOperations(identity.permissions, true, projectOperations)
    const data = rows.map(({ project: row, division }) => ({
      ...project.schemas.select.parse({ ...row, division }),
      allowedOperations,
    }))
    return c.json({ data, page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const projectDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: [authenticated(), requirePermission('detail-projects')],
  action: async (args) => args.c.json({ data: await readProject(await actor(args), requiredId(args)) }),
})

export const projectCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: [authenticated(), requirePermission('create-projects')],
  action: async (args) => {
    const identity = await actor(args)
    const { c } = args
    const input = project.schemas.create.parse(await c.req.json().catch(() => ({})))
    const message = await validateProject('create', { input })
    if (message) throw validationError(message)
    const inserted = await getDb().insert(projects).values({ ...input, createdByUserId: identity.userId, updatedByUserId: identity.userId }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Project was not created.')
    return c.json({ data: { ...project.schemas.select.parse(row), allowedOperations: ownerAllowedOperations(identity.permissions, false, projectOperations) } }, 201)
  },
})

export const projectUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: [authenticated(), requirePermission('update-projects')],
  action: async (args) => {
    const identity = await actor(args)
    const { c } = args
    const id = requiredId(args)
    await requireProjectCoverage(identity.userId, id)
    const input = project.schemas.update.parse(await c.req.json().catch(() => ({})))
    const message = await validateProject('update', { id, input })
    if (message) throw validationError(message)
    const updated = await getDb().update(projects).set({ ...input, updatedByUserId: identity.userId }).where(eq(projects.id, id)).returning()
    if (!updated[0]) throw notFound()
    return c.json({ data: { ...project.schemas.select.parse(updated[0]), allowedOperations: ownerAllowedOperations(identity.permissions, true, projectOperations) } })
  },
})

export const projectDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: [authenticated(), requirePermission('delete-projects')],
  action: async (args) => {
    const identity = await actor(args)
    const { c } = args
    const id = requiredId(args)
    await requireProjectCoverage(identity.userId, id)
    const message = await validateProject('delete', { id })
    if (message) throw validationError(message)
    const deleted = await getDb().delete(projects).where(eq(projects.id, id)).returning({ id: projects.id })
    if (!deleted[0]) throw notFound()
    return c.json({ ok: true })
  },
})

export const domain = defineDomainPart({ tables: { projects }, entities: [project], relations: [projectRelations] })

export const projectModel = defineModel({
  path: '/projects',
  entity: project,
  routes: {
    list: projectList,
    detail: projectDetail,
    create: projectCreate,
    update: projectUpdate,
    delete: projectDelete,
  },
})
