import { authenticated, create, defineRoute, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { and, asc, eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.entity'
import { projects } from '../projects/projects.entity'
import { uoms } from '../uoms/uoms.entity'
import { workItemRelations, workItems, workItem } from './work-items.entity'

const read = [authenticated(), requirePermission('view-work-items')]
const write = [authenticated(), requirePermission('manage-work-items')]

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

export const workItemTree = defineRoute({
  path: '/tree',
  method: 'get',
  authorize: read,
  action: async ({ c }) => {
    const projectId = c.req.query('projectId')
    if (!projectId) return c.json({ error: 'Project is required.' }, 400)
    const project = (await getDb().select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1))[0]
    if (!project) return c.json({ error: 'not_found' }, 404)
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
      .leftJoin(ptsWorkCategories, eq(workItems.categoryId, ptsWorkCategories.id))
      .leftJoin(uoms, eq(workItems.uomId, uoms.id))
      .where(and(eq(workItems.projectId, projectId), eq(workItems.active, true)))
      .orderBy(asc(workItems.level), asc(workItems.name))
    const nodes = rows.map((row) => ({ ...row, children: [] as unknown[], haveMaterialItp: null, haveProcessItp: null, haveProductsItp: null }))
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const roots: typeof nodes = []
    for (const node of nodes) {
      const parent = node.parentId ? byId.get(node.parentId) : undefined
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
    return c.json({ data: roots })
  },
})

export const domain = defineDomainPart({ tables: { workItems }, entities: [workItem], relations: [workItemRelations] })

export const workItemModel = defineModel({
  path: '/work-items',
  entity: workItem,
  routes: {
    list: list({ authorize: read }),
    tree: workItemTree,
    detail: detail({ authorize: read }),
    create: create({ authorize: write }),
    update: update({ authorize: write }),
    delete: deleteRoute({ authorize: write }),
  },
  validate: async ({ route, state }) => validateWorkItem(route.kind, state as { input?: unknown; id?: string }),
})
