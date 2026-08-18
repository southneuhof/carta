import { HttpError, notFound, validationError } from '@southneuhof/sprindle'
import { and, asc, count, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm'
import { accessibleProjectIds, allowedProjectOperations, allowedProjectPermissions, coveredProjectIds, hasProjectCoverage, requireProjectRecord, resolveSystemIdentity } from '../../authorization'
import type { PermissionCode } from '../../authorization/catalog'
import { getDb } from '../../db'
import { activityLogs } from '../notifications/notifications.entity'
import { projectRoleAssignments, roles } from '../roles/roles.entity'
import { divisions } from '../divisions/divisions.entity'
import { inspectionTestPlanInspectorPoints, inspectionTestPlanInspectorTypes, inspectionTestPlans, itpInspectionPoints, itpInspectorTypes } from '../inspection-test-plans/inspection-test-plans.entity'
import { numberConfigs } from '../number-configs/number-configs.entity'
import { projects } from '../projects/projects.entity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.entity'
import { qhssePts } from '../qhsse-pts/qhsse-pts.entity'
import { createOrReuseQualityInspectionPts } from '../qhsse-pts/qhsse-pts.service'
import { users } from '../users/users.entity'
import { workItems } from '../work-items/work-items.entity'
import {
  qualityInspectionDocumentations,
  qualityInspectionPtsRejections,
  qualityInspectionVerifications,
  qualityInspectionWorkItemItpSnapshots,
  qualityInspectionWorkItemItpSnapshotInspectors,
  qualityInspectionWorkItemItpSnapshotPoints,
  qualityInspectionWorkItemItpVerifications,
  qualityInspectionWorkItemItps,
  qualityInspections,
  qualityInspectionNumberCounters,
  workItemSchedules,
} from './quality-inspection.entity'
import {
  completeReportQualityInspectionSchema,
  createQualityInspectionSchema,
  qualityInspectionItpTypes,
  qualityInspectionPhotoNames,
  type QualityInspectionContextOperation,
  qualityInspectionRecordSchema,
  submitQualityInspectionDocumentationsSchema,
  updateQualityInspectionSchema,
  verifyQualityInspectionSchema,
  verifyQualityInspectionWorkItemItpSchema,
  type CreateQualityInspectionInput,
  type QualityInspectionRecord,
  type SelectedWorkItemInput,
} from './quality-inspection.schemas'

const operations = { update: 'update-quality-inspection', delete: 'delete-quality-inspection' } as const satisfies Record<'update' | 'delete', PermissionCode>
const contextPermissions = {
  create: 'create-quality-inspection',
  update: 'update-quality-inspection',
} as const satisfies Record<QualityInspectionContextOperation, PermissionCode>
const actionPermissions = {
  'complete-report': 'complete-report-quality-inspection',
  'verify-work-item': 'verify-quality-inspection-work-item-itp',
  documentation: 'submit-quality-inspection-documentations',
  verify: 'verify-quality-inspection',
} as const satisfies Record<string, PermissionCode>

type Db = ReturnType<typeof getDb>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

function now() {
  return new Date().toISOString()
}

async function reportById(id: string, includeDeleted = false, db: Db | Tx = getDb()) {
  const conditions: SQL[] = [eq(qualityInspections.id, id)]
  if (!includeDeleted) conditions.push(isNull(qualityInspections.deletedAt))
  return (await db.select().from(qualityInspections).where(and(...conditions)).limit(1))[0]
}

async function assertCoverage(id: string, userId: string) {
  const row = await reportById(id)
  if (!row || !(await hasProjectCoverage(userId, row.projectId))) throw notFound()
  return row
}

async function assertPermission(id: string, userId: string, permission: PermissionCode) {
  const row = await assertCoverage(id, userId)
  await requireProjectRecord(userId, row.projectId, permission)
  return row
}

async function operationMap(userId: string, projectIds: string[]) {
  const granted = await allowedProjectOperations(userId, projectIds, operations)
  const show = (await resolveSystemIdentity(userId))?.permissions.has('show-quality-inspection') ?? false
  return new Map(projectIds.map((projectId) => [projectId, [...(show ? ['detail'] : []), ...(granted.get(projectId) ?? [])]]))
}

async function actionMap(userId: string, row: { projectId: string; stepCode: string; statusCode: string }) {
  if (row.statusCode === 'close') return []
  const candidates = row.stepCode === 'report'
    ? ['complete-report']
    : row.stepCode === 'complete-report'
    ? ['verify-work-item']
    : row.stepCode === 'inspected'
    ? ['documentation']
    : row.stepCode === 'submitted'
    ? ['verify']
    : []
  const granted = await allowedProjectPermissions(userId, [row.projectId], candidates.map((action) => actionPermissions[action]))
  const permissions = granted.get(row.projectId) ?? new Set<PermissionCode>()
  return candidates.filter((action) => permissions.has(actionPermissions[action]))
}

async function numberForQualityInspection(tx: Tx, projectId: string, date: Date, projectNumber: string, divisionCode: string) {
  const configs = await tx.select().from(numberConfigs).where(eq(numberConfigs.active, true)).orderBy(asc(numberConfigs.displayOrder))
  if (!configs.length) throw validationError('No active number configuration exists.')
  const year = date.getUTCFullYear()
  const counter = await tx.insert(qualityInspectionNumberCounters).values({ projectId, year, lastNumber: 1 }).onConflictDoUpdate({
    target: [qualityInspectionNumberCounters.projectId, qualityInspectionNumberCounters.year],
    set: { lastNumber: sql`${qualityInspectionNumberCounters.lastNumber} + 1` },
  }).returning({ lastNumber: qualityInspectionNumberCounters.lastNumber })
  const sequence = counter[0]?.lastNumber ?? 1
  const month = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][date.getUTCMonth()]
  const values: Record<string, string> = { number: String(sequence), form_name: 'QI', project_number: projectNumber, division_code: divisionCode, year: String(year), month }
  const parts = configs.map((config: { numberVariableCode: string; numberOfDigits: number; customCode: string | null }) => {
    if (!(config.numberVariableCode in values) && config.numberVariableCode !== 'custom_code') throw validationError(`Unsupported number variable "${config.numberVariableCode}".`)
    const value = config.numberVariableCode === 'custom_code' ? config.customCode ?? '' : values[config.numberVariableCode]
    return config.numberVariableCode === 'number' ? value.padStart(config.numberOfDigits, '0') : value
  }).filter(Boolean)
  return parts.join('/')
}

async function addActivity(tx: Tx, row: { id: string; projectId: string; divisionId: string; statusCode: string; stepCode: string }, actorUserId: string, shortDescription: string, description?: string) {
  await tx.insert(activityLogs).values({
    actorUserId,
    projectId: row.projectId,
    divisionId: row.divisionId,
    moduleId: row.id,
    moduleName: 'quality-inspection',
    referenceTable: 'quality_inspection',
    referenceId: row.id,
    statusCode: row.statusCode,
    stepCode: row.stepCode,
    shortDescription,
    description,
  })
}

async function projectUsers(tx: Tx, projectId: string) {
  return tx.selectDistinct({ id: users.id, name: users.name }).from(users)
    .innerJoin(projectRoleAssignments, eq(projectRoleAssignments.userId, users.id))
    .innerJoin(projects, eq(projects.id, projectId))
    .innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId))
    .where(and(
      eq(projectRoleAssignments.active, true), eq(users.statusCode, 'active'), eq(roles.active, true), eq(roles.realm, 'project'),
      sql`(${projectRoleAssignments.coverageType} = 'all_projects' or (${projectRoleAssignments.coverageType} = 'division' and ${projectRoleAssignments.divisionId} = ${projects.divisionId}) or (${projectRoleAssignments.coverageType} = 'project' and ${projectRoleAssignments.projectId} = ${projectId}))`,
    )).orderBy(asc(users.name))
}

async function loadContext(userId: string, projectId: string, operation: QualityInspectionContextOperation) {
  await requireProjectRecord(userId, projectId, contextPermissions[operation])
  const db = getDb()
  const items = await db.select().from(workItems).where(and(eq(workItems.projectId, projectId), eq(workItems.active, true))).orderBy(asc(workItems.level), asc(workItems.name))
  const itemIds = items.map((item) => item.id)
  const itps = itemIds.length ? await db.select().from(inspectionTestPlans).where(and(inArray(inspectionTestPlans.workItemId, itemIds), eq(inspectionTestPlans.active, true))).orderBy(asc(inspectionTestPlans.createdAt)) : []
  const childrenByParent = new Map<string, typeof items>()
  for (const item of items) if (item.parentId) childrenByParent.set(item.parentId, [...(childrenByParent.get(item.parentId) ?? []), item])
  const itpsByItem = new Map<string, typeof itps>()
  for (const itp of itps) itpsByItem.set(itp.workItemId, [...(itpsByItem.get(itp.workItemId) ?? []), itp])
  const nodeById = new Map<string, any>()
  for (const item of items) nodeById.set(item.id, { id: item.id, projectId: item.projectId, parentId: item.parentId, level: item.level, code: item.code, name: item.name, isLeaf: !childrenByParent.has(item.id), itps: (itpsByItem.get(item.id) ?? []).filter((itp) => (qualityInspectionItpTypes as readonly string[]).includes(itp.type)), children: [] })
  const roots: any[] = []
  for (const item of items) {
    const node = nodeById.get(item.id)
    const parent = item.parentId ? nodeById.get(item.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const [divisionRows, projectRows, categoryRows, ownerRows] = await Promise.all([
    db.select({ id: divisions.id, code: divisions.code, name: divisions.name }).from(divisions).where(eq(divisions.active, true)).orderBy(asc(divisions.name)),
    db.select({ id: projects.id, number: projects.number, name: projects.name, divisionId: projects.divisionId }).from(projects).where(and(eq(projects.id, projectId), eq(projects.active, true))),
    db.select({ id: ptsWorkCategories.id, code: ptsWorkCategories.code, name: ptsWorkCategories.name }).from(ptsWorkCategories).where(eq(ptsWorkCategories.active, true)).orderBy(asc(ptsWorkCategories.name)),
    projectUsers(db as unknown as Tx, projectId),
  ])
  const activeItpTypes = [...new Set(itps.map((itp) => itp.type).filter((type): type is typeof qualityInspectionItpTypes[number] => (qualityInspectionItpTypes as readonly string[]).includes(type as string)))]
  return { tree: roots, activeItpTypes, divisions: divisionRows, projects: projectRows, qualityWorkCategories: categoryRows, owners: ownerRows }
}

async function validateRootAndRows(tx: Tx, input: { divisionId: string; projectId: string; qualityWorkCategoryId: string; workItemCategoryId: string; selectedRows: SelectedWorkItemInput[] }) {
  const [division, project, qualityCategory, root] = await Promise.all([
    tx.select({ id: divisions.id, active: divisions.active }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1),
    tx.select({ id: projects.id, divisionId: projects.divisionId, active: projects.active }).from(projects).where(eq(projects.id, input.projectId)).limit(1),
    tx.select({ id: ptsWorkCategories.id, active: ptsWorkCategories.active }).from(ptsWorkCategories).where(eq(ptsWorkCategories.id, input.qualityWorkCategoryId)).limit(1),
    tx.select({ id: workItems.id, projectId: workItems.projectId, parentId: workItems.parentId, categoryId: workItems.categoryId, active: workItems.active }).from(workItems).where(eq(workItems.id, input.workItemCategoryId)).limit(1),
  ])
  if (!division[0]?.active) throw validationError('Division is not active.')
  if (!project[0]?.active || project[0].divisionId !== input.divisionId) throw validationError('Project must be active and belong to the division.')
  if (!qualityCategory[0]?.active) throw validationError('Quality work category is not active.')
  if (!root[0] || !root[0].active || root[0].projectId !== input.projectId || root[0].parentId !== null || root[0].categoryId !== input.qualityWorkCategoryId) throw validationError('Work-item category is invalid for the project.')
  const ids = input.selectedRows.map((row) => row.workItemId)
  if (new Set(ids).size !== ids.length) throw validationError('A work item can be selected only once.')
  const projectItems = await tx.select().from(workItems).where(and(eq(workItems.projectId, input.projectId), eq(workItems.active, true)))
  const byId = new Map(projectItems.map((item) => [item.id, item]))
  const children = new Set(projectItems.map((item) => item.parentId).filter((id): id is string => Boolean(id)))
  for (const selected of input.selectedRows) {
    const item = byId.get(selected.workItemId)
    if (!item || children.has(item.id)) throw validationError('Selected work items must be active leaves.')
    let parent = item.parentId
    let descendant = false
    while (parent) {
      if (parent === input.workItemCategoryId) { descendant = true; break }
      parent = byId.get(parent)?.parentId ?? null
    }
    if (!descendant) throw validationError('Selected work items must belong to the selected category.')
    const itps = await tx.select().from(inspectionTestPlans).where(and(eq(inspectionTestPlans.workItemId, item.id), eq(inspectionTestPlans.active, true), inArray(inspectionTestPlans.type, selected.itpTypeCodes)))
    const byType = new Set(itps.map((itp) => itp.type))
    if (selected.itpTypeCodes.some((type) => !byType.has(type))) throw validationError('Every selected ITP type must be active for the work item.')
  }
}

async function snapshotRows(tx: Tx, rowId: string, workItemId: string, types: readonly string[], userId: string) {
  const itps = await tx.select().from(inspectionTestPlans).where(and(eq(inspectionTestPlans.workItemId, workItemId), eq(inspectionTestPlans.active, true), inArray(inspectionTestPlans.type, [...types])))
  const createdAt = now()
  for (const itp of itps) {
    const inserted = await tx.insert(qualityInspectionWorkItemItpSnapshots).values({
      qualityInspectionWorkItemItpId: rowId,
      sourceItpId: itp.id,
      type: itp.type,
      criteria: itp.criteria,
      procedureCode: itp.procedureCode,
      specification: itp.specification,
      method: itp.method,
      frequency: itp.frequency,
      imgDocumentation: itp.imgDocumentation,
      description: itp.description,
      createdByUserId: userId,
      updatedByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    }).returning({ id: qualityInspectionWorkItemItpSnapshots.id })
    const snapshotId = inserted[0]?.id
    if (!snapshotId) throw validationError('ITP snapshot was not created.')
    const inspectors = await tx.select({ child: inspectionTestPlanInspectorTypes, code: itpInspectorTypes.code, name: itpInspectorTypes.name }).from(inspectionTestPlanInspectorTypes)
      .innerJoin(itpInspectorTypes, eq(itpInspectorTypes.id, inspectionTestPlanInspectorTypes.inspectorTypeId))
      .where(and(eq(inspectionTestPlanInspectorTypes.inspectionTestPlanId, itp.id), eq(inspectionTestPlanInspectorTypes.active, true), eq(itpInspectorTypes.active, true)))
    for (const inspector of inspectors) {
      const snapshotInspector = (await tx.insert(qualityInspectionWorkItemItpSnapshotInspectors).values({ snapshotId, inspectorTypeCode: inspector.code, inspectorTypeName: inspector.name, createdByUserId: userId, updatedByUserId: userId, createdAt, updatedAt: createdAt }).returning({ id: qualityInspectionWorkItemItpSnapshotInspectors.id }))[0]
      if (!snapshotInspector) throw validationError('ITP inspector snapshot was not created.')
      const points = await tx.select({ point: inspectionTestPlanInspectorPoints, name: itpInspectionPoints.name }).from(inspectionTestPlanInspectorPoints)
        .innerJoin(itpInspectionPoints, eq(itpInspectionPoints.code, inspectionTestPlanInspectorPoints.inspectionPointCode))
        .where(and(eq(inspectionTestPlanInspectorPoints.inspectionTestPlanInspectorTypeId, inspector.child.id), eq(inspectionTestPlanInspectorPoints.active, true), eq(itpInspectionPoints.active, true)))
      if (points.length) await tx.insert(qualityInspectionWorkItemItpSnapshotPoints).values(points.map(({ point, name }) => ({ snapshotInspectorId: snapshotInspector.id, inspectionPointCode: point.inspectionPointCode, inspectionPointName: name, value: point.value, createdByUserId: userId, updatedByUserId: userId, createdAt, updatedAt: createdAt })))
    }
  }
}

async function insertSelectedRows(tx: Tx, reportId: string, selectedRows: SelectedWorkItemInput[], userId: string) {
  const createdAt = now()
  for (const selected of selectedRows) {
    const row = (await tx.insert(qualityInspectionWorkItemItps).values({ qualityInspectionId: reportId, workItemId: selected.workItemId, volume: String(selected.volume), statusCode: 'waiting', createdByUserId: userId, updatedByUserId: userId, createdAt, updatedAt: createdAt }).returning())[0]
    if (!row) throw validationError('Selected work item was not saved.')
    await snapshotRows(tx, row.id, selected.workItemId, selected.itpTypeCodes, userId)
  }
}

export async function createQualityInspection(userId: string, rawInput: unknown) {
  const input = createQualityInspectionSchema.parse(rawInput) as CreateQualityInspectionInput
  const db = getDb()
  const createdId = await db.transaction(async (tx) => {
    let derived: { divisionId: string; projectId: string; qualityWorkCategoryId: string; workItemCategoryId: string; scheduleId?: string; scheduleStartDate?: string | null; scheduleEndDate?: string | null }
    if ('scheduleId' in input) {
      const schedule = (await tx.select({ schedule: workItemSchedules, project: projects }).from(workItemSchedules).innerJoin(projects, eq(projects.id, workItemSchedules.projectId)).where(and(eq(workItemSchedules.id, input.scheduleId), eq(workItemSchedules.active, true), eq(projects.active, true))).limit(1))[0]
      if (!schedule) throw validationError('Schedule is not active.')
      const root = (await tx.select({ id: workItems.id, parentId: workItems.parentId, categoryId: workItems.categoryId, active: workItems.active }).from(workItems).where(eq(workItems.id, schedule.schedule.workItemId)).limit(1))[0]
      if (!root || !root.active || root.parentId !== null || !root.categoryId) throw validationError('Schedule must reference an active project root work item.')
      derived = { divisionId: schedule.project.divisionId, projectId: schedule.project.id, qualityWorkCategoryId: root.categoryId, workItemCategoryId: root.id, scheduleId: schedule.schedule.id, scheduleStartDate: schedule.schedule.startDate, scheduleEndDate: schedule.schedule.endDate }
    } else {
      derived = { divisionId: input.divisionId, projectId: input.projectId, qualityWorkCategoryId: input.qualityWorkCategoryId, workItemCategoryId: input.workItemCategoryId }
    }
    await requireProjectRecord(userId, derived.projectId, 'create-quality-inspection')
    await validateRootAndRows(tx, { ...derived, selectedRows: input.selectedRows })
    const project = (await tx.select({ number: projects.number }).from(projects).where(eq(projects.id, derived.projectId)).limit(1))[0]
    const division = (await tx.select({ code: divisions.code }).from(divisions).where(eq(divisions.id, derived.divisionId)).limit(1))[0]
    if (!project || !division) throw validationError('Project or division not found.')
    const createdAt = now()
    const inserted = await tx.insert(qualityInspections).values({
      ...derived,
      number: await numberForQualityInspection(tx, derived.projectId, new Date(), project.number, division.code),
      targetDate: input.targetDate,
      locationZone: input.locationZone ?? null,
      statusCode: 'open',
      stepCode: 'report',
      createdByUserId: userId,
      updatedByUserId: userId,
      createdAt,
      updatedAt: createdAt,
    }).returning({ id: qualityInspections.id })
    const id = inserted[0]?.id
    if (!id) throw validationError('Quality Inspection was not created.')
    await insertSelectedRows(tx, id, input.selectedRows, userId)
    const saved = (await tx.select().from(qualityInspections).where(eq(qualityInspections.id, id)).limit(1))[0]
    if (!saved) throw validationError('Quality Inspection was not created.')
    await addActivity(tx, saved, userId, 'Inspection/Test created.')
    return id
  })
  return getQualityInspection(userId, createdId)
}

export async function listQualityInspections(userId: string, query: Record<string, unknown>) {
  const projectIds = coveredProjectIds(userId)
  const conditions: SQL[] = [inArray(qualityInspections.projectId, projectIds), isNull(qualityInspections.deletedAt)]
  if (typeof query.projectId === 'string') conditions.push(eq(qualityInspections.projectId, query.projectId))
  if (typeof query.statusCode === 'string') conditions.push(eq(qualityInspections.statusCode, query.statusCode))
  if (typeof query.stepCode === 'string') conditions.push(eq(qualityInspections.stepCode, query.stepCode))
  if (typeof query.search === 'string' && query.search) conditions.push(sql`${qualityInspections.number} ilike ${`%${query.search}%`}`)
  const page = Number(query.page)
  const limit = Number(query.limit)
  const where = and(...conditions)
  const db = getDb()
  const rows = await db.select({ row: qualityInspections, projectName: projects.name, divisionName: divisions.name }).from(qualityInspections)
    .innerJoin(projects, eq(projects.id, qualityInspections.projectId)).innerJoin(divisions, eq(divisions.id, qualityInspections.divisionId))
    .where(where).orderBy(desc(qualityInspections.createdAt)).limit(limit).offset((page - 1) * limit)
  const total = await db.select({ value: count() }).from(qualityInspections).where(where)
  const ops = await operationMap(userId, [...new Set(rows.map(({ row }) => row.projectId))])
  return { data: rows.map(({ row, projectName, divisionName }) => ({ ...qualityInspectionRecordSchema.parse(row), projectName, divisionName, allowedOperations: row.stepCode === 'report' && row.statusCode === 'open' ? ops.get(row.projectId) ?? ['detail'] : ['detail'] })), total: Number(total[0]?.value ?? 0) }
}

async function loadDetail(db: Db | Tx, row: typeof qualityInspections.$inferSelect, userId: string): Promise<QualityInspectionRecord> {
  const [project, division, category, root, createdBy, itemRows, docs, reportEvents, rejections, activity] = await Promise.all([
    db.select({ id: projects.id, number: projects.number, name: projects.name }).from(projects).where(eq(projects.id, row.projectId)).limit(1),
    db.select({ id: divisions.id, code: divisions.code, name: divisions.name }).from(divisions).where(eq(divisions.id, row.divisionId)).limit(1),
    db.select({ id: ptsWorkCategories.id, code: ptsWorkCategories.code, name: ptsWorkCategories.name }).from(ptsWorkCategories).where(eq(ptsWorkCategories.id, row.qualityWorkCategoryId)).limit(1),
    db.select({ id: workItems.id, code: workItems.code, name: workItems.name }).from(workItems).where(eq(workItems.id, row.workItemCategoryId)).limit(1),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, row.createdByUserId)).limit(1),
    db.select({ row: qualityInspectionWorkItemItps, workItem: { id: workItems.id, code: workItems.code, name: workItems.name } }).from(qualityInspectionWorkItemItps).innerJoin(workItems, eq(workItems.id, qualityInspectionWorkItemItps.workItemId)).where(eq(qualityInspectionWorkItemItps.qualityInspectionId, row.id)).orderBy(asc(qualityInspectionWorkItemItps.createdAt)),
    db.select().from(qualityInspectionDocumentations).where(eq(qualityInspectionDocumentations.qualityInspectionId, row.id)).orderBy(asc(qualityInspectionDocumentations.name)),
    db.select().from(qualityInspectionVerifications).where(eq(qualityInspectionVerifications.qualityInspectionId, row.id)).orderBy(asc(qualityInspectionVerifications.verifiedAt)),
    db.select().from(qualityInspectionPtsRejections).where(eq(qualityInspectionPtsRejections.qualityInspectionId, row.id)).orderBy(asc(qualityInspectionPtsRejections.rejectedAt)),
    db.select().from(activityLogs).where(and(eq(activityLogs.referenceTable, 'quality_inspection'), eq(activityLogs.referenceId, row.id))).orderBy(desc(activityLogs.createdAt)),
  ])
  const rowIds = itemRows.map(({ row: item }) => item.id)
  const snapshots = rowIds.length ? await db.select().from(qualityInspectionWorkItemItpSnapshots).where(inArray(qualityInspectionWorkItemItpSnapshots.qualityInspectionWorkItemItpId, rowIds)).orderBy(asc(qualityInspectionWorkItemItpSnapshots.createdAt)) : []
  const snapshotIds = snapshots.map((snapshot) => snapshot.id)
  const inspectors = snapshotIds.length ? await db.select().from(qualityInspectionWorkItemItpSnapshotInspectors).where(inArray(qualityInspectionWorkItemItpSnapshotInspectors.snapshotId, snapshotIds)).orderBy(asc(qualityInspectionWorkItemItpSnapshotInspectors.createdAt)) : []
  const inspectorIds = inspectors.map((inspector) => inspector.id)
  const points = inspectorIds.length ? await db.select().from(qualityInspectionWorkItemItpSnapshotPoints).where(inArray(qualityInspectionWorkItemItpSnapshotPoints.snapshotInspectorId, inspectorIds)).orderBy(asc(qualityInspectionWorkItemItpSnapshotPoints.createdAt)) : []
  const itemVerifications = rowIds.length ? await db.select().from(qualityInspectionWorkItemItpVerifications).where(inArray(qualityInspectionWorkItemItpVerifications.qualityInspectionWorkItemItpId, rowIds)).orderBy(asc(qualityInspectionWorkItemItpVerifications.verifiedAt)) : []
  const ptsIds = itemRows.map(({ row: item }) => item.qhssePtsId).filter((id): id is string => Boolean(id))
  const ptsRows = ptsIds.length ? await db.select({ id: qhssePts.id, number: qhssePts.number, statusCode: qhssePts.statusCode, stepCode: qhssePts.stepCode }).from(qhssePts).where(inArray(qhssePts.id, ptsIds)) : []
  const snapshotsByRow = new Map<string, typeof snapshots>()
  for (const snapshot of snapshots) snapshotsByRow.set(snapshot.qualityInspectionWorkItemItpId, [...(snapshotsByRow.get(snapshot.qualityInspectionWorkItemItpId) ?? []), snapshot])
  const inspectorsBySnapshot = new Map<string, typeof inspectors>()
  for (const inspector of inspectors) inspectorsBySnapshot.set(inspector.snapshotId, [...(inspectorsBySnapshot.get(inspector.snapshotId) ?? []), inspector])
  const pointsByInspector = new Map<string, typeof points>()
  for (const point of points) pointsByInspector.set(point.snapshotInspectorId, [...(pointsByInspector.get(point.snapshotInspectorId) ?? []), point])
  const verificationsByRow = new Map<string, typeof itemVerifications>()
  for (const event of itemVerifications) verificationsByRow.set(event.qualityInspectionWorkItemItpId, [...(verificationsByRow.get(event.qualityInspectionWorkItemItpId) ?? []), event])
  const ptsById = new Map(ptsRows.map((pts) => [pts.id, pts]))
  const allowedOperations = row.statusCode === 'open' && row.stepCode === 'report' ? (await operationMap(userId, [row.projectId])).get(row.projectId) ?? ['detail'] : ['detail']
  const allowedActions = await actionMap(userId, row)
  return {
    ...qualityInspectionRecordSchema.parse(row),
    project: project[0], division: division[0], qualityWorkCategory: category[0], workItemCategory: root[0], createdByUser: createdBy[0],
    workItems: itemRows.map(({ row: item, workItem }) => ({
      row: item,
      workItem,
      allowedActions: item.statusCode === 'waiting' && allowedActions.includes('verify-work-item') ? ['verify-work-item'] : [],
      snapshots: (snapshotsByRow.get(item.id) ?? []).map((snapshot) => ({ ...snapshot, inspectors: (inspectorsBySnapshot.get(snapshot.id) ?? []).map((inspector) => ({ ...inspector, points: pointsByInspector.get(inspector.id) ?? [] })) })),
      verifications: verificationsByRow.get(item.id) ?? [],
      pts: item.qhssePtsId ? ptsById.get(item.qhssePtsId) : undefined,
    })),
    documentations: docs,
    verifications: reportEvents,
    ptsRejections: rejections,
    activity,
    allowedOperations,
    allowedActions,
  } as unknown as QualityInspectionRecord
}

export async function getQualityInspection(userId: string, id: string) {
  const row = await assertCoverage(id, userId)
  return loadDetail(getDb(), row, userId)
}

export async function updateQualityInspection(userId: string, id: string, rawInput: unknown) {
  const current = await assertPermission(id, userId, 'update-quality-inspection')
  if (current.statusCode !== 'open' || current.stepCode !== 'report') throw new HttpError(409, 'invalid_transition', 'Only open report-stage inspections can be updated.')
  const input = updateQualityInspectionSchema.parse(rawInput)
  const updated = await getDb().transaction(async (tx) => {
    const locked = (await tx.select().from(qualityInspections).where(and(eq(qualityInspections.id, id), isNull(qualityInspections.deletedAt))).for('update'))[0]
    if (!locked || locked.statusCode !== 'open' || locked.stepCode !== 'report') throw new HttpError(409, 'invalid_transition', 'Only open report-stage inspections can be updated.')
    if (locked.scheduleId && [input.divisionId, input.projectId, input.qualityWorkCategoryId, input.workItemCategoryId].some((value) => value !== undefined)) throw validationError('Scheduled report origins cannot be changed.')
    const merged = { divisionId: input.divisionId ?? locked.divisionId, projectId: input.projectId ?? locked.projectId, qualityWorkCategoryId: input.qualityWorkCategoryId ?? locked.qualityWorkCategoryId, workItemCategoryId: input.workItemCategoryId ?? locked.workItemCategoryId, selectedRows: input.selectedRows ?? [] }
    const referencesChanged = input.divisionId !== undefined || input.projectId !== undefined || input.qualityWorkCategoryId !== undefined || input.workItemCategoryId !== undefined
    if (input.selectedRows || referencesChanged) {
      if (!input.selectedRows) {
        const existingRows = await tx.select().from(qualityInspectionWorkItemItps).where(eq(qualityInspectionWorkItemItps.qualityInspectionId, id))
        const existingTypes = existingRows.length ? await tx.select({ rowId: qualityInspectionWorkItemItpSnapshots.qualityInspectionWorkItemItpId, type: qualityInspectionWorkItemItpSnapshots.type }).from(qualityInspectionWorkItemItpSnapshots).where(inArray(qualityInspectionWorkItemItpSnapshots.qualityInspectionWorkItemItpId, existingRows.map((row) => row.id))) : []
        const typesByRow = new Map<string, string[]>()
        for (const snapshot of existingTypes) typesByRow.set(snapshot.rowId, [...(typesByRow.get(snapshot.rowId) ?? []), snapshot.type])
        merged.selectedRows = existingRows.map((row) => ({ workItemId: row.workItemId, volume: row.volume, itpTypeCodes: (typesByRow.get(row.id) ?? []).filter((type): type is SelectedWorkItemInput['itpTypeCodes'][number] => (qualityInspectionItpTypes as readonly string[]).includes(type)) }))
      }
      await validateRootAndRows(tx, merged)
    }
    if (input.selectedRows) {
      await tx.delete(qualityInspectionWorkItemItps).where(eq(qualityInspectionWorkItemItps.qualityInspectionId, id))
      await insertSelectedRows(tx, id, input.selectedRows, userId)
    }
    const saved = (await tx.update(qualityInspections).set({
      divisionId: merged.divisionId, projectId: merged.projectId, qualityWorkCategoryId: merged.qualityWorkCategoryId, workItemCategoryId: merged.workItemCategoryId,
      targetDate: input.targetDate ?? locked.targetDate, locationZone: input.locationZone !== undefined ? input.locationZone : locked.locationZone, updatedByUserId: userId, updatedAt: now(),
    }).where(eq(qualityInspections.id, id)).returning())[0]
    if (!saved) throw notFound()
    await addActivity(tx, saved, userId, 'Inspection/Test updated.')
    return saved
  })
  return getQualityInspection(userId, updated.id)
}

export async function deleteQualityInspection(userId: string, id: string, rawInput?: unknown) {
  const current = await assertPermission(id, userId, 'delete-quality-inspection')
  if (current.statusCode !== 'open' || current.stepCode !== 'report') throw new HttpError(409, 'invalid_transition', 'Only open report-stage inspections can be deleted.')
  const reason = rawInput && typeof rawInput === 'object' && typeof (rawInput as { deletedReason?: unknown }).deletedReason === 'string' ? (rawInput as { deletedReason: string }).deletedReason.trim() : undefined
  const saved = await getDb().transaction(async (tx) => {
    const locked = (await tx.select().from(qualityInspections).where(and(eq(qualityInspections.id, id), isNull(qualityInspections.deletedAt))).for('update'))[0]
    if (!locked || locked.statusCode !== 'open' || locked.stepCode !== 'report') throw new HttpError(409, 'invalid_transition', 'Only open report-stage inspections can be deleted.')
    const deleted = (await tx.update(qualityInspections).set({ deletedByUserId: userId, deletedAt: now(), deletedReason: reason ?? null, updatedByUserId: userId, updatedAt: now() }).where(eq(qualityInspections.id, id)).returning())[0]
    if (!deleted) throw notFound()
    await addActivity(tx, deleted, userId, 'Inspection/Test deleted.', reason)
    return deleted
  })
  return qualityInspectionRecordSchema.parse(saved)
}

export async function completeReportQualityInspection(userId: string, id: string, rawInput: unknown) {
  await assertPermission(id, userId, actionPermissions['complete-report'])
  const input = completeReportQualityInspectionSchema.parse(rawInput)
  const saved = await getDb().transaction(async (tx) => {
    const locked = (await tx.select().from(qualityInspections).where(and(eq(qualityInspections.id, id), isNull(qualityInspections.deletedAt))).for('update'))[0]
    if (!locked) throw notFound()
    if (locked.statusCode !== 'open' || locked.stepCode !== 'report') throw new HttpError(409, 'invalid_transition', 'The inspection is not ready for completion.')
    const point = (await tx.select({ code: itpInspectionPoints.code }).from(itpInspectionPoints).where(and(eq(itpInspectionPoints.code, input.inspectionPointCode), eq(itpInspectionPoints.active, true))).limit(1))[0]
    if (!point) throw validationError('Inspection Point must be active.')
    const updated = (await tx.update(qualityInspections).set({ inspectionPointCode: input.inspectionPointCode, workMethod: input.workMethod, statusCode: 'on-progress', stepCode: 'complete-report', updatedByUserId: userId, updatedAt: now() }).where(eq(qualityInspections.id, id)).returning())[0]
    if (!updated) throw notFound()
    await addActivity(tx, updated, userId, 'Inspection/Test procedure completed.')
    return updated
  })
  return getQualityInspection(userId, saved.id)
}

export async function verifyQualityInspectionWorkItemItp(userId: string, id: string, rowId: string, rawInput: unknown) {
  await assertPermission(id, userId, actionPermissions['verify-work-item'])
  const input = verifyQualityInspectionWorkItemItpSchema.parse(rawInput)
  const saved = await getDb().transaction(async (tx) => {
    const report = (await tx.select().from(qualityInspections).where(and(eq(qualityInspections.id, id), isNull(qualityInspections.deletedAt))).for('update'))[0]
    if (!report) throw notFound()
    if (report.statusCode !== 'on-progress' || report.stepCode !== 'complete-report') throw new HttpError(409, 'invalid_transition', 'The inspection is not ready for item verification.')
    const row = (await tx.select().from(qualityInspectionWorkItemItps).where(and(eq(qualityInspectionWorkItemItps.id, rowId), eq(qualityInspectionWorkItemItps.qualityInspectionId, id))).for('update'))[0]
    if (!row) throw notFound()
    if (row.statusCode !== 'waiting') throw new HttpError(409, 'invalid_transition', 'This work-item row already has a result.')
    let ptsId = row.qhssePtsId
    if (input.resultCode === 'rejected') {
      const pts = await createOrReuseQualityInspectionPts(tx, { reportId: id, workItemRowId: row.id, projectId: report.projectId, divisionId: report.divisionId, ptsWorkCategoryId: report.qualityWorkCategoryId, workItemCategoryId: report.workItemCategoryId, workItemId: row.workItemId, locationZone: report.locationZone, actorUserId: userId, note: input.description ?? null })
      ptsId = pts.id
      await tx.insert(qualityInspectionPtsRejections).values({ qualityInspectionId: id, qualityInspectionWorkItemItpId: row.id, qhssePtsId: pts.id, note: input.description ?? null, rejectingUserId: userId, rejectedAt: now() })
    }
    const updated = (await tx.update(qualityInspectionWorkItemItps).set({ statusCode: input.resultCode, verificationDescription: input.description ?? null, verifiedBy: userId, verifiedAt: now(), qhssePtsId: ptsId, updatedByUserId: userId, updatedAt: now() }).where(eq(qualityInspectionWorkItemItps.id, row.id)).returning())[0]
    if (!updated) throw notFound()
    await tx.insert(qualityInspectionWorkItemItpVerifications).values({ qualityInspectionWorkItemItpId: row.id, resultCode: input.resultCode, description: input.description ?? null, verifierId: userId, verifiedAt: now() })
    const waiting = await tx.select({ id: qualityInspectionWorkItemItps.id }).from(qualityInspectionWorkItemItps).where(and(eq(qualityInspectionWorkItemItps.qualityInspectionId, id), eq(qualityInspectionWorkItemItps.statusCode, 'waiting')))
    const reportUpdate = (await tx.update(qualityInspections).set({ stepCode: waiting.length ? 'complete-report' : 'inspected', statusCode: 'on-progress', updatedByUserId: userId, updatedAt: now() }).where(eq(qualityInspections.id, id)).returning())[0]
    if (!reportUpdate) throw notFound()
    if (!waiting.length) {
      const docs = await tx.select({ name: qualityInspectionDocumentations.name }).from(qualityInspectionDocumentations).where(eq(qualityInspectionDocumentations.qualityInspectionId, id))
      const existingNames = new Set(docs.map((doc) => doc.name))
      const missingNames = qualityInspectionPhotoNames.filter((name) => !existingNames.has(name))
      if (missingNames.length) await tx.insert(qualityInspectionDocumentations).values(missingNames.map((name) => ({ qualityInspectionId: id, name, fileAttachment: null, description: null, createdByUserId: userId, updatedByUserId: userId, createdAt: now(), updatedAt: now() })))
    }
    await addActivity(tx, reportUpdate, userId, `Inspection/Test item ${input.resultCode}.`, input.description)
    return reportUpdate
  })
  return getQualityInspection(userId, saved.id)
}

export async function submitQualityInspectionDocumentations(userId: string, id: string, rawInput: unknown) {
  await assertPermission(id, userId, actionPermissions.documentation)
  const input = submitQualityInspectionDocumentationsSchema.parse(rawInput)
  const saved = await getDb().transaction(async (tx) => {
    const report = (await tx.select().from(qualityInspections).where(and(eq(qualityInspections.id, id), isNull(qualityInspections.deletedAt))).for('update'))[0]
    if (!report) throw notFound()
    if (report.statusCode !== 'on-progress' || report.stepCode !== 'inspected') throw new HttpError(409, 'invalid_transition', 'The inspection is not ready for documentation.')
    for (const documentation of input.documentations) {
      const updated = (await tx.update(qualityInspectionDocumentations).set({ fileAttachment: documentation.fileAttachment, description: documentation.description ?? null, updatedByUserId: userId, updatedAt: now() }).where(and(eq(qualityInspectionDocumentations.qualityInspectionId, id), eq(qualityInspectionDocumentations.name, documentation.name))).returning({ id: qualityInspectionDocumentations.id }))[0]
      if (!updated) throw validationError('All four documentation slots are required.')
    }
    const docs = await tx.select({ name: qualityInspectionDocumentations.name, fileAttachment: qualityInspectionDocumentations.fileAttachment }).from(qualityInspectionDocumentations).where(eq(qualityInspectionDocumentations.qualityInspectionId, id))
    if (qualityInspectionPhotoNames.some((name) => !docs.some((doc) => doc.name === name && doc.fileAttachment))) throw validationError('All four documentation files are required.')
    const updated = (await tx.update(qualityInspections).set({ stepCode: 'submitted', statusCode: 'on-progress', updatedByUserId: userId, updatedAt: now() }).where(eq(qualityInspections.id, id)).returning())[0]
    if (!updated) throw notFound()
    await addActivity(tx, updated, userId, 'Inspection/Test documentation submitted.')
    return updated
  })
  return getQualityInspection(userId, saved.id)
}

export async function verifyQualityInspection(userId: string, id: string, rawInput: unknown) {
  await assertPermission(id, userId, actionPermissions.verify)
  const input = verifyQualityInspectionSchema.parse(rawInput)
  const saved = await getDb().transaction(async (tx) => {
    const report = (await tx.select().from(qualityInspections).where(and(eq(qualityInspections.id, id), isNull(qualityInspections.deletedAt))).for('update'))[0]
    if (!report) throw notFound()
    if (report.statusCode !== 'on-progress' || report.stepCode !== 'submitted') throw new HttpError(409, 'invalid_transition', 'The inspection is not ready for verification.')
    const next = input.resultCode === 'repair' ? { statusCode: 'on-progress', stepCode: 'complete-report' } : input.resultCode === 'pending' ? { statusCode: 'on-progress', stepCode: 'submitted' } : { statusCode: 'close', stepCode: 'close' }
    if (input.resultCode === 'repair') await tx.update(qualityInspectionWorkItemItps).set({ statusCode: 'waiting', verificationDescription: null, verifiedBy: null, verifiedAt: null, updatedByUserId: userId, updatedAt: now() }).where(eq(qualityInspectionWorkItemItps.qualityInspectionId, id))
    const updated = (await tx.update(qualityInspections).set({ ...next, resultCode: input.resultCode, verificationDescription: input.description ?? null, updatedByUserId: userId, updatedAt: now() }).where(eq(qualityInspections.id, id)).returning())[0]
    if (!updated) throw notFound()
    await tx.insert(qualityInspectionVerifications).values({ qualityInspectionId: id, resultCode: input.resultCode, description: input.description ?? null, resultingStatusCode: next.statusCode, resultingStepCode: next.stepCode, verifierId: userId, verifiedAt: now() })
    await addActivity(tx, updated, userId, `Inspection/Test ${input.resultCode}.`, input.description)
    return updated
  })
  return loadDetail(getDb(), saved, userId)
}

export async function listQualityInspectionSchedules(userId: string) {
  const ids = accessibleProjectIds(userId, 'create-quality-inspection')
  const rows = await getDb().select({ schedule: workItemSchedules, project: { id: projects.id, number: projects.number, name: projects.name }, division: { id: divisions.id, code: divisions.code, name: divisions.name }, workItem: { id: workItems.id, code: workItems.code, name: workItems.name } }).from(workItemSchedules)
    .innerJoin(projects, eq(projects.id, workItemSchedules.projectId)).innerJoin(divisions, eq(divisions.id, projects.divisionId)).innerJoin(workItems, eq(workItems.id, workItemSchedules.workItemId))
    .where(and(inArray(workItemSchedules.projectId, ids), eq(workItemSchedules.active, true), eq(projects.active, true), eq(workItems.active, true), isNull(workItems.parentId)))
    .orderBy(desc(workItemSchedules.startDate))
  return rows
}

export async function scheduleCreateContext(userId: string, id: string) {
  const schedule = (await getDb().select({ schedule: workItemSchedules, project: projects }).from(workItemSchedules).innerJoin(projects, eq(projects.id, workItemSchedules.projectId)).where(and(eq(workItemSchedules.id, id), eq(workItemSchedules.active, true), eq(projects.active, true))).limit(1))[0]
  if (!schedule || !(await hasProjectCoverage(userId, schedule.project.id))) throw notFound()
  return { schedule: schedule.schedule, project: schedule.project, context: await loadContext(userId, schedule.project.id, 'create') }
}

export function loadQualityInspectionCreateContext(userId: string, projectId: string, operation: QualityInspectionContextOperation) {
  return loadContext(userId, projectId, operation)
}
