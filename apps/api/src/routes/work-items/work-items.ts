import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { notFound, unauthorized, validationError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { listQuerySchema } from '@southneuhof/sprindle/validation'
import { and, asc, count, desc, eq, getTableColumns, ilike, inArray, or, type SQL } from 'drizzle-orm'
import { getDb } from '../../db'
import { allowedProjectOperations, accessibleProjectIds, requireProjectRecord } from '../../authorization'
import { orgIdentity } from '../../identity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.entity'
import { projects } from '../projects/projects.entity'
import { uoms } from '../uoms/uoms.entity'
import { workItemRelations, workItems, workItem } from './work-items.entity'

const workItemColumns = getTableColumns(workItems) as Record<string, unknown>
const reservedQueryKeys = new Set(['page', 'limit', 'search', 'sort', 'order'])
const workItemOperations = { detail: 'view-work-items', update: 'manage-work-items', delete: 'manage-work-items' } as const

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity
}

async function validateWorkItem(route: string, state: { input?: unknown; id?: string }) {
  const input = state.input && typeof state.input === 'object' ? (state.input as Record<string, unknown>) : {}
  if (route === 'create' || route === 'update') {
    const existing = route === 'update' && state.id
      ? (await getDb().select({ projectId: workItems.projectId, parentId: workItems.parentId, categoryId: workItems.categoryId, volume: workItems.volume, uomId: workItems.uomId, level: workItems.level }).from(workItems).where(eq(workItems.id, state.id)).limit(1))[0]
      : undefined
    const projectId = typeof input.projectId === 'string' ? input.projectId : existing?.projectId
    const parentId = 'parentId' in input ? input.parentId : existing?.parentId
    const categoryId = 'categoryId' in input ? input.categoryId : existing?.categoryId
    const volume = 'volume' in input ? input.volume : existing?.volume
    const uomId = 'uomId' in input ? input.uomId : existing?.uomId
    if (typeof projectId !== 'string') return 'Project is required.'
    const project = (await getDb().select({ active: projects.active }).from(projects).where(eq(projects.id, projectId)).limit(1))[0]
    if (!project) return 'Project not found.'
    if (!project.active) return 'Inactive project cannot receive an active work item.'
    if (volume == null || !Number.isFinite(Number(volume))) return 'Volume is required.'
    if (typeof uomId !== 'string') return 'UOM is required.'
    const uom = (await getDb().select({ active: uoms.active, uomType: uoms.uomType }).from(uoms).where(eq(uoms.id, uomId)).limit(1))[0]
    if (!uom || uom.uomType !== 'work-items') return 'Work Item UOM is invalid.'
    if (!uom.active) return 'Inactive UOM cannot receive a work item.'
    if (parentId == null) {
      if (typeof categoryId !== 'string') return 'Category is required for a root work item.'
      const category = (await getDb().select({ active: ptsWorkCategories.active }).from(ptsWorkCategories).where(eq(ptsWorkCategories.id, categoryId)).limit(1))[0]
      if (!category?.active) return 'Active category is required for a root work item.'
    } else {
      if (typeof parentId !== 'string' || parentId === state.id) return 'Work-item parent is invalid.'
      if (categoryId != null) return 'Child work items cannot have a category.'
      const parent = (await getDb().select({ projectId: workItems.projectId, active: workItems.active, parentId: workItems.parentId, level: workItems.level }).from(workItems).where(eq(workItems.id, parentId)).limit(1))[0]
      if (!parent || parent.projectId !== projectId) return 'Work-item parent must use the same project.'
      if (!parent.active) return 'Inactive work-item parent cannot receive an active child.'
      if (route === 'create') input.level = parent.level + 1
      let current = parent.parentId
      while (current) {
        if (current === state.id) return 'Work-item parent cannot create a cycle.'
        current = (await getDb().select({ parentId: workItems.parentId }).from(workItems).where(eq(workItems.id, current)).limit(1))[0]?.parentId ?? null
      }
    }
    if (route === 'create') {
      input.code = `WI-${crypto.randomUUID()}`
      if (input.level == null) input.level = 1
    }
  }
  if (route === 'delete' && state.id) {
    const references = await getDb().select({ id: workItems.id }).from(workItems).where(eq(workItems.parentId, state.id)).limit(1)
    if (references.length) return 'Referenced records must be deactivated before delete.'
  }
  return undefined
}

function listWhere(query: Record<string, unknown>, scope: ReturnType<typeof accessibleProjectIds>) {
  const filters: SQL[] = []
  for (const [key, value] of Object.entries(query)) {
    if (reservedQueryKeys.has(key) || value === undefined) continue
    const column = workItemColumns[key]
    if (!column) throw validationError(`Unknown query parameter "${key}".`)
    filters.push(eq(column as never, value as never))
  }
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  return and(
    inArray(workItems.projectId, scope),
    ...filters,
    ...(search ? [or(ilike(workItems.code, search), ilike(workItems.name, search))] : []),
  )
}

function requiredId(args: Parameters<typeof actor>[0]) {
  const id = args.c.req.param('id')
  if (!id) throw notFound()
  return id
}

function orderBy(query: Record<string, unknown>) {
  if (!query.sort) return [asc(workItems.name)]
  const column = workItemColumns[String(query.sort)]
  if (!column) throw validationError(`Unknown sort column "${query.sort}".`)
  return [query.order === 'desc' ? desc(column as never) : asc(column as never)]
}

async function readWorkItem(userId: string, id: string, permission: 'view-work-items' | 'manage-work-items' = 'view-work-items') {
  const row = (await getDb()
    .select({ item: workItems, project: projects, category: ptsWorkCategories, uom: uoms })
    .from(workItems)
    .innerJoin(projects, eq(projects.id, workItems.projectId))
    .leftJoin(ptsWorkCategories, eq(ptsWorkCategories.id, workItems.categoryId))
    .leftJoin(uoms, eq(uoms.id, workItems.uomId))
    .where(eq(workItems.id, id))
    .limit(1))[0]
  if (!row) throw notFound()
  await requireProjectRecord(userId, row.item.projectId, permission)
  const operations = await allowedProjectOperations(userId, [row.item.projectId], workItemOperations)
  return { ...workItem.schemas.select.parse({ ...row.item, project: row.project, category: row.category, uom: row.uom }), allowedOperations: operations.get(row.item.projectId) ?? [] }
}

export const workItemList = defineRoute({
  kind: 'list',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await actor(args)
    const query = listQuerySchema.parse(args.c.req.query()) as Record<string, unknown>
    const where = listWhere(query, accessibleProjectIds(identity.userId, 'view-work-items'))
    const page = Number(query.page)
    const limit = Number(query.limit)
    const db = getDb()
    const [rows, totalRows] = await Promise.all([
      db.select({ item: workItems, project: projects, category: ptsWorkCategories, uom: uoms }).from(workItems).innerJoin(projects, eq(projects.id, workItems.projectId)).leftJoin(ptsWorkCategories, eq(ptsWorkCategories.id, workItems.categoryId)).leftJoin(uoms, eq(uoms.id, workItems.uomId)).where(where).orderBy(...orderBy(query)).limit(limit).offset((page - 1) * limit),
      db.select({ value: count() }).from(workItems).where(where),
    ])
    const operations = await allowedProjectOperations(identity.userId, rows.map(({ item }) => item.projectId), workItemOperations)
    const data = rows.map(({ item, project: parent, category, uom }) => ({
      ...workItem.schemas.select.parse({ ...item, project: parent, category, uom }),
      allowedOperations: operations.get(item.projectId) ?? [],
    }))
    return args.c.json({ data, page, limit, total: Number(totalRows[0]?.value ?? 0) })
  },
})

export const workItemTree = defineRoute({
  kind: 'custom',
  path: '/tree',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await actor(args)
    const projectId = args.c.req.query('projectId')
    if (!projectId) throw validationError('Project is required.')
    await requireProjectRecord(identity.userId, projectId, 'view-work-items')
    const rows = await getDb()
      .select({
        id: workItems.id,
        projectId: workItems.projectId,
        parentId: workItems.parentId,
        level: workItems.level,
        name: workItems.name,
        categoryName: ptsWorkCategories.name,
        volume: workItems.volume,
        uomName: uoms.name,
        isHighRisk: workItems.isHighRisk,
      })
      .from(workItems)
      .leftJoin(ptsWorkCategories, eq(ptsWorkCategories.id, workItems.categoryId))
      .leftJoin(uoms, eq(uoms.id, workItems.uomId))
      .where(and(eq(workItems.projectId, projectId), eq(workItems.active, true)))
      .orderBy(asc(workItems.level), asc(workItems.name))
    const operations = await allowedProjectOperations(identity.userId, [projectId], workItemOperations)
    const nodes = rows.map((row) => ({ ...row, allowedOperations: operations.get(projectId) ?? [], children: [] as unknown[], haveMaterialItp: null, haveProcessItp: null, haveProductsItp: null }))
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const roots: typeof nodes = []
    for (const node of nodes) {
      const parent = node.parentId ? byId.get(node.parentId) : undefined
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
    return args.c.json({ data: roots })
  },
})

export const workItemDetail = defineRoute({
  kind: 'detail',
  path: '/:id',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => args.c.json({ data: await readWorkItem((await actor(args)).userId, requiredId(args)) }),
})

export const workItemCreate = defineRoute({
  kind: 'create',
  method: 'post',
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await actor(args)
    const input = workItem.schemas.create.parse(await args.c.req.json().catch(() => ({})))
    const projectId = input.projectId
    if (!projectId) throw validationError('Project is required.')
    await requireProjectRecord(identity.userId, projectId, 'manage-work-items')
    const message = await validateWorkItem('create', { input })
    if (message) throw validationError(message)
    const code = typeof input.code === 'string' ? input.code : `WI-${crypto.randomUUID()}`
    const inserted = await getDb().insert(workItems).values({ ...input, code, createdByUserId: identity.userId, updatedByUserId: identity.userId }).returning()
    const row = inserted[0]
    if (!row) throw validationError('Work item was not created.')
    return args.c.json({ data: await readWorkItem(identity.userId, row.id, 'manage-work-items') }, 201)
  },
})

export const workItemUpdate = defineRoute({
  kind: 'update',
  path: '/:id',
  method: 'patch',
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const current = (await getDb().select({ projectId: workItems.projectId }).from(workItems).where(eq(workItems.id, id)).limit(1))[0]
    if (!current) throw notFound()
    await requireProjectRecord(identity.userId, current.projectId, 'manage-work-items')
    const input = workItem.schemas.update.parse(await args.c.req.json().catch(() => ({})))
    if (input.projectId && input.projectId !== current.projectId) await requireProjectRecord(identity.userId, input.projectId, 'manage-work-items')
    const message = await validateWorkItem('update', { id, input })
    if (message) throw validationError(message)
    const updated = await getDb().update(workItems).set({ ...input, updatedByUserId: identity.userId }).where(eq(workItems.id, id)).returning()
    if (!updated[0]) throw notFound()
    return args.c.json({ data: await readWorkItem(identity.userId, updated[0].id, 'manage-work-items') })
  },
})

export const workItemDelete = defineRoute({
  kind: 'delete',
  path: '/:id',
  method: 'delete',
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await actor(args)
    const id = requiredId(args)
    const current = (await getDb().select({ projectId: workItems.projectId }).from(workItems).where(eq(workItems.id, id)).limit(1))[0]
    if (!current) throw notFound()
    await requireProjectRecord(identity.userId, current.projectId, 'manage-work-items')
    const message = await validateWorkItem('delete', { id })
    if (message) throw validationError(message)
    const deleted = await getDb().delete(workItems).where(eq(workItems.id, id)).returning({ id: workItems.id })
    if (!deleted[0]) throw notFound()
    return args.c.json({ ok: true })
  },
})

export const domain = defineDomainPart({ tables: { workItems }, entities: [workItem], relations: [workItemRelations] })

export const workItemModel = defineModel({
  path: '/work-items',
  entity: workItem,
  routes: {
    list: workItemList,
    tree: workItemTree,
    detail: workItemDetail,
    create: workItemCreate,
    update: workItemUpdate,
    delete: workItemDelete,
  },
})
