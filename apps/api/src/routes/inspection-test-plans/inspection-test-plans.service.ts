import { HttpError, notFound, validationError } from '@southneuhof/sprindle'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { PermissionCode } from '../../authorization/catalog'
import { allowedProjectOperations, requireProjectCoverage, requireProjectRecord } from '../../authorization'
import { getDb } from '../../db'
import { workItems } from '../work-items/work-items.entity'
import {
  inspectionTestPlanInspectorPoints,
  inspectionTestPlanInspectorTypes,
  inspectionTestPlans,
  itpInspectionPoints,
  itpInspectorTypes,
} from './inspection-test-plans.entity'
import {
  createInspectionTestPlanSchema,
  inspectionPointCodes,
  inspectionTestPlanRecordSchema,
  inspectionTestPlanRowSchema,
  inspectionTestPlanTypes,
  inspectionTestPlanTemplateSchema,
  inspectionTestPlanTreeSchema,
  inspectorTypeCodes,
  updateInspectionTestPlanSchema,
  type CreateInspectionTestPlanInput,
  type InspectionTestPlanRecord,
  type InspectionTestPlanTemplate,
  type InspectionTestPlanTreeNode,
  type InspectionTestPlanTreeRow,
  type InspectorGridEntry,
  type UpdateInspectionTestPlanInput,
} from './inspection-test-plans.schemas'

const operations = {
  update: 'update-work-item-itp',
  delete: 'delete-work-item-itp',
} as const satisfies Record<'update' | 'delete', PermissionCode>

const inspectorTypeOrder = new Map(inspectorTypeCodes.map((code, index) => [code, index]))
const inspectionPointOrder = new Map(inspectionPointCodes.map((code, index) => [code, index]))

function now() {
  return new Date().toISOString()
}

function sortedByCode<T extends { code: string }>(rows: T[], order: Map<string, number>) {
  return [...rows].sort((left, right) => (order.get(left.code) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.code) ?? Number.MAX_SAFE_INTEGER))
}

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === 'object' && (error as { code?: unknown }).code === '23505')
}

async function withConflict<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError(409, 'conflict', 'An active ITP already exists for this work item and type.')
    throw error
  }
}

async function activeMasters(db = getDb()) {
  const [types, points] = await Promise.all([
    db.select({ id: itpInspectorTypes.id, code: itpInspectorTypes.code, name: itpInspectorTypes.name }).from(itpInspectorTypes).where(eq(itpInspectorTypes.active, true)),
    db.select({ code: itpInspectionPoints.code, name: itpInspectionPoints.name }).from(itpInspectionPoints).where(eq(itpInspectionPoints.active, true)),
  ])
  return { types: sortedByCode(types, inspectorTypeOrder), points: sortedByCode(points, inspectionPointOrder) }
}

export async function loadInspectionTestPlanTemplate(projectId: string, userId: string): Promise<InspectionTestPlanTemplate> {
  if (!projectId) throw validationError('Project is required.')
  await requireProjectCoverage(userId, projectId)
  const masters = await activeMasters()
  const template = inspectionTestPlanTemplateSchema.parse({ inspectorTypes: masters.types, inspectionPoints: masters.points })
  return template
}

async function lockWorkItem(tx: any, userId: string, workItemId: string, permission: PermissionCode) {
  const row = (await tx.select().from(workItems).where(eq(workItems.id, workItemId)).for('update'))[0]
  if (!row) throw notFound()
  await requireProjectCoverage(userId, row.projectId)
  await requireProjectRecord(userId, row.projectId, permission)
  if (!row.active) throw validationError('Inactive work items cannot receive an ITP.')
  const child = await tx.select({ id: workItems.id }).from(workItems).where(and(
    eq(workItems.projectId, row.projectId),
    eq(workItems.parentId, row.id),
    eq(workItems.active, true),
  )).limit(1)
  if (child[0]) throw validationError('An ITP must use a leaf work item.')
  return row as typeof workItems.$inferSelect
}

async function validateInspectorGrid(tx: any, inspectors: InspectorGridEntry[]) {
  const { types, points } = await activeMasters(tx)
  const typesById = new Map(types.map((type) => [type.id, type]))
  const pointsByCode = new Map(points.map((point) => [point.code, point]))
  if (inspectors.length !== types.length) throw validationError('Inspector grid must include every active inspector type.')

  const seenTypes = new Set<string>()
  for (const inspector of inspectors) {
    if (seenTypes.has(inspector.inspectorTypeId)) throw validationError('Inspector grid cannot contain duplicate inspector types.')
    seenTypes.add(inspector.inspectorTypeId)
    if (!typesById.has(inspector.inspectorTypeId)) throw validationError('Inspector type must be active.')
    if (inspector.points.length !== points.length) throw validationError('Inspector grid must include every active inspection point.')
    const seenPoints = new Set<string>()
    for (const point of inspector.points) {
      if (seenPoints.has(point.inspectionPointCode)) throw validationError('Inspector grid cannot contain duplicate inspection points.')
      seenPoints.add(point.inspectionPointCode)
      if (!pointsByCode.has(point.inspectionPointCode)) throw validationError('Inspection point must be active.')
    }
    if (seenPoints.size !== points.length) throw validationError('Inspector grid must include every active inspection point.')
  }
  if (seenTypes.size !== types.length) throw validationError('Inspector grid must include every active inspector type.')
  return { types, points }
}

type PlanOperation = 'detail' | 'update' | 'delete'

async function operationMap(userId: string, projectId: string) {
  const granted = (await allowedProjectOperations(userId, [projectId], operations)).get(projectId) ?? []
  return ['detail', ...granted] as PlanOperation[]
}

async function detailFromRow(db: any, row: typeof inspectionTestPlans.$inferSelect, allowed: PlanOperation[]): Promise<InspectionTestPlanRecord> {
  const childRows = await db.select({
    child: inspectionTestPlanInspectorTypes,
    master: { id: itpInspectorTypes.id, code: itpInspectorTypes.code, name: itpInspectorTypes.name },
  }).from(inspectionTestPlanInspectorTypes)
    .innerJoin(itpInspectorTypes, eq(itpInspectorTypes.id, inspectionTestPlanInspectorTypes.inspectorTypeId))
    .where(and(eq(inspectionTestPlanInspectorTypes.inspectionTestPlanId, row.id), eq(inspectionTestPlanInspectorTypes.active, true), eq(itpInspectorTypes.active, true)))
    .orderBy(asc(inspectionTestPlanInspectorTypes.id))
  childRows.sort((left: { master: { code: string } }, right: { master: { code: string } }) => (inspectorTypeOrder.get(left.master.code as never) ?? Number.MAX_SAFE_INTEGER) - (inspectorTypeOrder.get(right.master.code as never) ?? Number.MAX_SAFE_INTEGER))

  const childIds = childRows.map(({ child }: { child: typeof inspectionTestPlanInspectorTypes.$inferSelect }) => child.id)
  const pointRows = childIds.length ? await db.select({
    point: inspectionTestPlanInspectorPoints,
    master: { code: itpInspectionPoints.code, name: itpInspectionPoints.name },
  }).from(inspectionTestPlanInspectorPoints)
    .innerJoin(itpInspectionPoints, eq(itpInspectionPoints.code, inspectionTestPlanInspectorPoints.inspectionPointCode))
    .where(and(inArray(inspectionTestPlanInspectorPoints.inspectionTestPlanInspectorTypeId, childIds), eq(inspectionTestPlanInspectorPoints.active, true), eq(itpInspectionPoints.active, true)))
    .orderBy(asc(inspectionTestPlanInspectorPoints.id)) : []

  const pointsByChild = new Map<string, Array<{ id: string; inspectionPointCode: string; inspectionPointName: string; value: boolean }>>()
  for (const { point, master } of pointRows) {
    pointsByChild.set(point.inspectionTestPlanInspectorTypeId, [
      ...(pointsByChild.get(point.inspectionTestPlanInspectorTypeId) ?? []),
      { id: point.id, inspectionPointCode: master.code, inspectionPointName: master.name, value: point.value },
    ])
  }
  for (const points of pointsByChild.values()) points.sort((left, right) => (inspectionPointOrder.get(left.inspectionPointCode as never) ?? Number.MAX_SAFE_INTEGER) - (inspectionPointOrder.get(right.inspectionPointCode as never) ?? Number.MAX_SAFE_INTEGER))

  const record = {
    ...inspectionTestPlanRowSchema.parse({ ...row, allowedOperations: allowed }),
    inspectors: childRows.map(({ child, master }: { child: typeof inspectionTestPlanInspectorTypes.$inferSelect; master: { id: string; code: string; name: string } }) => ({
      id: child.id,
      inspectionTestPlanId: child.inspectionTestPlanId,
      inspectorTypeId: child.inspectorTypeId,
      inspectorTypeCode: master.code,
      inspectorTypeName: master.name,
      points: pointsByChild.get(child.id) ?? [],
    })),
  }
  return inspectionTestPlanRecordSchema.parse(record)
}

async function planProject(id: string) {
  const row = (await getDb().select({ plan: inspectionTestPlans, projectId: workItems.projectId }).from(inspectionTestPlans)
    .innerJoin(workItems, eq(workItems.id, inspectionTestPlans.workItemId))
    .where(eq(inspectionTestPlans.id, id)).limit(1))[0]
  if (!row) throw notFound()
  return row
}

export async function getInspectionTestPlan(userId: string, id: string) {
  const located = await planProject(id)
  await requireProjectCoverage(userId, located.projectId)
  if (!located.plan.active) throw notFound()
  const allowed = await operationMap(userId, located.projectId)
  return detailFromRow(getDb(), located.plan, allowed)
}

export async function createInspectionTestPlan(userId: string, rawInput: unknown) {
  const input = createInspectionTestPlanSchema.parse(rawInput) as CreateInspectionTestPlanInput
  const target = (await getDb().select({ projectId: workItems.projectId }).from(workItems).where(eq(workItems.id, input.workItemId)).limit(1))[0]
  if (!target) throw notFound()
  await requireProjectCoverage(userId, target.projectId)
  await requireProjectRecord(userId, target.projectId, 'create-work-item-itp')

  const createdId = await withConflict(() => getDb().transaction(async (tx) => {
    const workItem = await lockWorkItem(tx, userId, input.workItemId, 'create-work-item-itp')
    await validateInspectorGrid(tx, input.inspectors)
    const duplicate = await tx.select({ id: inspectionTestPlans.id }).from(inspectionTestPlans).where(and(
      eq(inspectionTestPlans.workItemId, workItem.id),
      eq(inspectionTestPlans.type, input.type),
      eq(inspectionTestPlans.active, true),
    )).limit(1)
    if (duplicate[0]) throw new HttpError(409, 'conflict', 'An active ITP already exists for this work item and type.')

    const inserted = await tx.insert(inspectionTestPlans).values({
      workItemId: workItem.id,
      type: input.type,
      criteria: input.criteria ?? null,
      procedureCode: input.procedureCode ?? null,
      specification: input.specification ?? null,
      method: input.method ?? null,
      frequency: input.frequency,
      imgDocumentation: input.imgDocumentation ?? null,
      description: input.description ?? null,
      active: true,
      createdByUserId: userId,
      updatedByUserId: userId,
    }).returning({ id: inspectionTestPlans.id })
    const id = inserted[0]?.id
    if (!id) throw validationError('ITP was not created.')
    await insertGrid(tx, id, input.inspectors, userId)
    return id
  }))
  return getInspectionTestPlan(userId, createdId)
}

async function insertGrid(tx: any, planId: string, inspectors: InspectorGridEntry[], userId: string) {
  const createdAt = now()
  const childValues = inspectors.map((inspector) => ({
    inspectionTestPlanId: planId,
    inspectorTypeId: inspector.inspectorTypeId,
    active: true,
    createdByUserId: userId,
    updatedByUserId: userId,
    createdAt,
    updatedAt: createdAt,
  }))
  if (childValues.length) {
    const children = await tx.insert(inspectionTestPlanInspectorTypes).values(childValues).returning({ id: inspectionTestPlanInspectorTypes.id, inspectorTypeId: inspectionTestPlanInspectorTypes.inspectorTypeId })
    const childByType = new Map(children.map((child: { id: string; inspectorTypeId: string }) => [child.inspectorTypeId, child.id]))
    const pointValues = inspectors.flatMap((inspector) => inspector.points.map((point) => ({
      inspectionTestPlanInspectorTypeId: childByType.get(inspector.inspectorTypeId)!,
      inspectionPointCode: point.inspectionPointCode,
      value: point.value,
      active: true,
      createdByUserId: userId,
      updatedByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    })))
    if (pointValues.length) await tx.insert(inspectionTestPlanInspectorPoints).values(pointValues)
  }
}

async function syncGrid(tx: any, planId: string, inspectors: InspectorGridEntry[], userId: string) {
  const { types, points } = await validateInspectorGrid(tx, inspectors)
  const timestamp = now()
  const children: Array<typeof inspectionTestPlanInspectorTypes.$inferSelect> = await tx.select().from(inspectionTestPlanInspectorTypes).where(eq(inspectionTestPlanInspectorTypes.inspectionTestPlanId, planId))
  const childrenByType = new Map<string, typeof inspectionTestPlanInspectorTypes.$inferSelect>(children.map((child) => [child.inspectorTypeId, child]))
  const activeTypeIds = new Set(types.map((type) => type.id))
  for (const child of children) {
    if (!activeTypeIds.has(child.inspectorTypeId)) await tx.update(inspectionTestPlanInspectorTypes).set({ active: false, updatedByUserId: userId, updatedAt: timestamp }).where(eq(inspectionTestPlanInspectorTypes.id, child.id))
  }

  const pointCodes = new Set(points.map((point) => point.code))
  for (const inspector of inspectors) {
    const existing = childrenByType.get(inspector.inspectorTypeId)
    const child = (existing
      ? (await tx.update(inspectionTestPlanInspectorTypes).set({ active: true, updatedByUserId: userId, updatedAt: timestamp }).where(eq(inspectionTestPlanInspectorTypes.id, existing.id)).returning())[0]
      : (await tx.insert(inspectionTestPlanInspectorTypes).values({ inspectionTestPlanId: planId, inspectorTypeId: inspector.inspectorTypeId, active: true, createdByUserId: userId, updatedByUserId: userId, createdAt: timestamp, updatedAt: timestamp }).returning())[0]) as typeof inspectionTestPlanInspectorTypes.$inferSelect | undefined
    if (!child) throw validationError('Inspector grid was not saved.')
    const existingPoints: Array<typeof inspectionTestPlanInspectorPoints.$inferSelect> = await tx.select().from(inspectionTestPlanInspectorPoints).where(eq(inspectionTestPlanInspectorPoints.inspectionTestPlanInspectorTypeId, child.id))
    const byCode = new Map<string, typeof inspectionTestPlanInspectorPoints.$inferSelect>(existingPoints.map((point) => [point.inspectionPointCode, point]))
    for (const existingPoint of existingPoints) {
      if (!pointCodes.has(existingPoint.inspectionPointCode)) await tx.update(inspectionTestPlanInspectorPoints).set({ active: false, updatedByUserId: userId, updatedAt: timestamp }).where(eq(inspectionTestPlanInspectorPoints.id, existingPoint.id))
    }
    for (const point of inspector.points) {
      const current = byCode.get(point.inspectionPointCode)
      if (current) {
        await tx.update(inspectionTestPlanInspectorPoints).set({ active: true, value: point.value, updatedByUserId: userId, updatedAt: timestamp }).where(eq(inspectionTestPlanInspectorPoints.id, current.id))
      } else {
        await tx.insert(inspectionTestPlanInspectorPoints).values({ inspectionTestPlanInspectorTypeId: child.id, inspectionPointCode: point.inspectionPointCode, value: point.value, active: true, createdByUserId: userId, updatedByUserId: userId, createdAt: timestamp, updatedAt: timestamp })
      }
    }
  }
}

export async function updateInspectionTestPlan(userId: string, id: string, rawInput: unknown) {
  const input = updateInspectionTestPlanSchema.parse(rawInput) as UpdateInspectionTestPlanInput
  const located = await planProject(id)
  await requireProjectCoverage(userId, located.projectId)
  await requireProjectRecord(userId, located.projectId, 'update-work-item-itp')

  await withConflict(() => getDb().transaction(async (tx) => {
    const locked = (await tx.select().from(inspectionTestPlans).where(and(eq(inspectionTestPlans.id, id), eq(inspectionTestPlans.active, true))).for('update'))[0]
    if (!locked) throw notFound()
    const workItem = await lockWorkItem(tx, userId, locked.workItemId, 'update-work-item-itp')
    await validateInspectorGrid(tx, input.inspectors)
    const nextType = input.type ?? locked.type
    const duplicate = await tx.select({ id: inspectionTestPlans.id }).from(inspectionTestPlans).where(and(
      eq(inspectionTestPlans.workItemId, workItem.id),
      eq(inspectionTestPlans.type, nextType),
      eq(inspectionTestPlans.active, true),
    )).limit(1)
    if (duplicate[0] && duplicate[0].id !== id) throw new HttpError(409, 'conflict', 'An active ITP already exists for this work item and type.')
    const updated = await tx.update(inspectionTestPlans).set({
      type: nextType,
      criteria: input.criteria !== undefined ? input.criteria : locked.criteria,
      procedureCode: input.procedureCode !== undefined ? input.procedureCode : locked.procedureCode,
      specification: input.specification !== undefined ? input.specification : locked.specification,
      method: input.method !== undefined ? input.method : locked.method,
      frequency: input.frequency ?? locked.frequency,
      imgDocumentation: input.imgDocumentation !== undefined ? input.imgDocumentation : locked.imgDocumentation,
      description: input.description !== undefined ? input.description : locked.description,
      updatedByUserId: userId,
      updatedAt: now(),
    }).where(eq(inspectionTestPlans.id, id)).returning({ id: inspectionTestPlans.id })
    if (!updated[0]) throw notFound()
    await syncGrid(tx, id, input.inspectors, userId)
  }) )
  return getInspectionTestPlan(userId, id)
}

export async function deleteInspectionTestPlan(userId: string, id: string) {
  const located = await planProject(id)
  await requireProjectCoverage(userId, located.projectId)
  await requireProjectRecord(userId, located.projectId, 'delete-work-item-itp')
  const deleted = await getDb().transaction(async (tx) => {
    const locked = (await tx.select().from(inspectionTestPlans).where(and(eq(inspectionTestPlans.id, id), eq(inspectionTestPlans.active, true))).for('update'))[0]
    if (!locked) throw notFound()
    const result = await tx.update(inspectionTestPlans).set({ active: false, updatedByUserId: userId, updatedAt: now() }).where(eq(inspectionTestPlans.id, id)).returning({ id: inspectionTestPlans.id, active: inspectionTestPlans.active })
    if (!result[0]) throw notFound()
    return result[0]
  })
  return deleted
}

export async function loadInspectionTestPlanTree(userId: string, projectId: string) {
  if (!projectId) throw validationError('Project is required.')
  await requireProjectCoverage(userId, projectId)
  const db = getDb()
  const items = await db.select().from(workItems).where(and(eq(workItems.projectId, projectId), eq(workItems.active, true))).orderBy(asc(workItems.level), asc(workItems.name))
  const ids = items.map((item) => item.id)
  const plans = ids.length ? await db.select().from(inspectionTestPlans).where(and(inArray(inspectionTestPlans.workItemId, ids), eq(inspectionTestPlans.active, true))).orderBy(asc(inspectionTestPlans.createdAt)) : []
  const allowed = await operationMap(userId, projectId)
  const plansByItem = new Map<string, InspectionTestPlanTreeRow[]>()
  for (const plan of plans) {
    const parsed = inspectionTestPlanRowSchema.parse({ ...plan, allowedOperations: allowed })
    plansByItem.set(plan.workItemId, [...(plansByItem.get(plan.workItemId) ?? []), parsed])
  }
  const childrenByParent = new Map<string, typeof items>()
  for (const item of items) {
    if (item.parentId) childrenByParent.set(item.parentId, [...(childrenByParent.get(item.parentId) ?? []), item])
  }
  const nodeById = new Map<string, InspectionTestPlanTreeNode>()
  for (const item of items) {
    const itemPlans = plansByItem.get(item.id) ?? []
    const isLeaf = !childrenByParent.has(item.id)
    nodeById.set(item.id, {
      id: item.id,
      projectId: item.projectId,
      parentId: item.parentId,
      level: item.level,
      code: item.code,
      name: item.name,
      isLeaf,
      availableTypes: isLeaf ? inspectionTestPlanTypes.filter((type) => !itemPlans.some((plan) => plan.type === type)) : [],
      itps: itemPlans,
      children: [],
    })
  }
  const roots: InspectionTestPlanTreeNode[] = []
  for (const item of items) {
    const node = nodeById.get(item.id)!
    const parent = item.parentId ? nodeById.get(item.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return inspectionTestPlanTreeSchema.parse(roots)
}

export {
  createInspectionTestPlanSchema,
  inspectionTestPlanRecordSchema,
  updateInspectionTestPlanSchema,
}
