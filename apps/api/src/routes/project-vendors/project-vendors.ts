import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, desc, eq, getTableColumns, ilike, inArray, or, type SQL } from 'drizzle-orm'
import { requireProjectCoverage } from '../../authorization'
import { orgIdentity, requirePermission } from '../../identity'
import { coerceBooleanQuery, ownerAllowedOperations, ownerListProjectScope } from '../../owner-list'
import { getDb } from '../../db'
import { projects } from '../projects/projects.entity'
import { projectVendorRelations, projectVendors, projectVendor } from './project-vendors.entity'

const vendorColumns = getTableColumns(projectVendors) as Record<string, unknown>
const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order', 'permission'])
const vendorOperations = { detail: 'detail-project-vendors', update: 'update-project-vendors', delete: 'delete-project-vendors' } as const

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity
}

async function validateProjectVendor(input: unknown) {
  const values = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  if (typeof values.projectId !== 'string') return undefined
  const target = (await getDb().select({ active: projects.active }).from(projects).where(eq(projects.id, values.projectId)).limit(1))[0]
  if (!target) return 'Project not found.'
  if (!target.active) return 'Inactive project cannot receive a vendor.'
  return undefined
}

function listWhere(query: Record<string, unknown>, scope: ReturnType<typeof ownerListProjectScope>) {
  const filters: SQL[] = []
  for (const [key, value] of Object.entries(query)) {
    if (reservedQueryKeys.has(key) || value === undefined) continue
    const column = vendorColumns[key]
    if (!column) throw validationError(`Unknown query parameter "${key}".`)
    filters.push(eq(column as never, value as never))
  }
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  return and(
    inArray(projectVendors.projectId, scope),
    ...filters,
    ...(search ? [or(ilike(projectVendors.name, search), ilike(projectVendors.description, search))] : []),
  )
}

function requiredId(args: Parameters<typeof actor>[0]) {
  const id = args.c.req.param('id')
  if (!id) throw notFound()
  return id
}

function orderBy(query: Record<string, unknown>) {
  if (!query.sort) return [asc(projectVendors.name)]
  const column = vendorColumns[String(query.sort)]
  if (!column) throw validationError(`Unknown sort column "${query.sort}".`)
  return [query.order === 'desc' ? desc(column as never) : asc(column as never)]
}

async function readVendor(identity: Awaited<ReturnType<typeof actor>>, id: string) {
  const row = (await getDb().select({ vendor: projectVendors, project: projects }).from(projectVendors).innerJoin(projects, eq(projects.id, projectVendors.projectId)).where(eq(projectVendors.id, id)).limit(1))[0]
  if (!row) throw notFound()
  await requireProjectCoverage(identity.userId, row.vendor.projectId)
  return {
    ...projectVendor.schemas.select.parse({ ...row.vendor, project: row.project }),
    allowedOperations: ownerAllowedOperations(identity.permissions, true, vendorOperations),
  }
}

export const projectVendorList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: [authenticated(), requirePermission('list-project-vendors')],
  action: async (args) => {
    const identity = await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    coerceBooleanQuery(query, 'active')
    const where = listWhere(query, ownerListProjectScope(identity.userId, query))
    const page = Number(query.page)
    const limit = Number(query.limit)
    const db = getDb()
    const [rows, totalRows] = await Promise.all([
      db.select({ vendor: projectVendors, project: projects }).from(projectVendors).innerJoin(projects, eq(projects.id, projectVendors.projectId)).where(where).orderBy(...orderBy(query)).limit(limit).offset((page - 1) * limit),
      db.select({ value: count() }).from(projectVendors).where(where),
    ])
    const allowedOperations = ownerAllowedOperations(identity.permissions, true, vendorOperations)
    const data = rows.map(({ vendor: row, project: parent }) => ({
      ...projectVendor.schemas.select.parse({ ...row, project: parent }),
      allowedOperations,
    }))
    return args.c.json({ data, page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const projectVendorDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: [authenticated(), requirePermission('detail-project-vendors')],
  action: async (args) => args.c.json({ data: await readVendor(await actor(args), requiredId(args)) }),
})

export const projectVendorCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: [authenticated(), requirePermission('create-project-vendors')],
  action: async (args) => {
    const identity = await actor(args)
    const input = projectVendor.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    await requireProjectCoverage(identity.userId, input.projectId)
    const message = await validateProjectVendor(input)
    if (message) throw validationError(message)
    const inserted = await getDb().insert(projectVendors).values({ ...input, createdByUserId: identity.userId, updatedByUserId: identity.userId }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Project vendor was not created.')
    return args.c.json({ data: { ...projectVendor.schemas.select.parse(row), allowedOperations: ownerAllowedOperations(identity.permissions, true, vendorOperations) } }, 201)
  },
})

export const projectVendorUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: [authenticated(), requirePermission('update-project-vendors')],
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const current = (await getDb().select({ projectId: projectVendors.projectId }).from(projectVendors).where(eq(projectVendors.id, id)).limit(1))[0]
    if (!current) throw notFound()
    await requireProjectCoverage(identity.userId, current.projectId)
    const input = projectVendor.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    if (input.projectId && input.projectId !== current.projectId) await requireProjectCoverage(identity.userId, input.projectId)
    const message = await validateProjectVendor(input)
    if (message) throw validationError(message)
    const updated = await getDb().update(projectVendors).set({ ...input, updatedByUserId: identity.userId }).where(eq(projectVendors.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: { ...projectVendor.schemas.select.parse(updated[0]), allowedOperations: ownerAllowedOperations(identity.permissions, true, vendorOperations) } })
  },
})

export const projectVendorDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: [authenticated(), requirePermission('delete-project-vendors')],
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const current = (await getDb().select({ projectId: projectVendors.projectId }).from(projectVendors).where(eq(projectVendors.id, id)).limit(1))[0]
    if (!current) throw notFound()
    await requireProjectCoverage(identity.userId, current.projectId)
    const deleted = await getDb().delete(projectVendors).where(eq(projectVendors.id, id)).returning({ id: projectVendors.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const domain = defineDomainPart({ tables: { projectVendors }, entities: [projectVendor], relations: [projectVendorRelations] })

export const projectVendorModel = defineModel({
  path: '/project-vendors',
  entity: projectVendor,
  routes: {
    list: projectVendorList,
    detail: projectVendorDetail,
    create: projectVendorCreate,
    update: projectVendorUpdate,
    delete: projectVendorDelete,
  },
})
