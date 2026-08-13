import { forbidden, HttpError, notFound, validationError } from '@southneuhof/sprindle'
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lt, or, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { PermissionCode } from '../../authorization/catalog'
import { allowedProjectOperations, allowedProjectPermissions, coveredProjectIds, hasProjectCoverage, requireProjectRecord } from '../../authorization'
import { getDb } from '../../db'
import { activityLogs, notifications } from '../notifications/notifications.entity'
import { authorizationModules, permissions, projectRoleAssignments, rolePermissions, roles } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { divisions } from '../divisions/divisions.entity'
import { numberConfigs } from '../number-configs/number-configs.entity'
import { projects } from '../projects/projects.entity'
import { projectVendors } from '../project-vendors/project-vendors.entity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.entity'
import { rootCauses } from '../root-causes/root-causes.entity'
import { workItems } from '../work-items/work-items.entity'
import { qhssePts, qhssePtsEntity, qhssePtsNumberCounters, qhssePtsRootCauses } from './qhsse-pts.entity'
import {
  actionSchemas,
  createReportSchema,
  updateReportSchema,
  type ActionName,
  type ActionInput,
  type CreateReportInput,
  type UpdateReportInput,
} from './qhsse-pts.schemas'

export { actionSchemas, createReportSchema, updateReportSchema }
export type { ActionName, ActionInput, CreateReportInput, UpdateReportInput }

const workflowSteps = [
  'report',
  'high-disposition',
  'low-disposition',
  'temporary-plan',
  'management-notes',
  'complete-report',
  'follow-up-implementation',
  'follow-up-price',
  'follow-up',
  'implementation-report',
  'approved-implementation',
  'realization',
  'close',
] as const

type PtsRow = typeof qhssePts.$inferSelect
type ActionRow = Pick<PtsRow, 'criteriaCode' | 'projectId' | 'stepCode' | 'statusCode' | 'somUserId' | 'implementationUserId' | 'estimationCost'>
type ActionDefinition = {
  permission: (row: ActionRow) => PermissionCode
  steps: readonly string[]
}

const actionCatalog: Record<ActionName, ActionDefinition> = {
  disposition: {
    permission: (row) => row.criteriaCode === 'low' ? 'low-disposition-qhsse-pts' : 'high-disposition-qhsse-pts',
    steps: ['report'],
  },
  'temporary-plan': { permission: () => 'temporary-plan-qhsse-pts', steps: ['high-disposition'] },
  'management-notes': { permission: () => 'management-notes-qhsse-pts', steps: ['management-notes'] },
  'complete-report': { permission: () => 'complete-report-qhsse-pts', steps: ['low-disposition', 'complete-report'] },
  'follow-up-implementation': { permission: () => 'follow-up-implementation-qhsse-pts', steps: ['complete-report', 'follow-up-price'] },
  'follow-up-price': { permission: () => 'follow-up-price-qhsse-pts', steps: ['complete-report', 'follow-up-implementation'] },
  'implementation-report': { permission: () => 'implementation-report-qhsse-pts', steps: ['follow-up'] },
  'verify-implementation': { permission: () => 'verify-implementation-qhsse-pts', steps: ['implementation-report'] },
  realization: { permission: () => 'realization-qhsse-pts', steps: ['approved-implementation'] },
  close: { permission: () => 'close-qhsse-pts', steps: ['realization'] },
  delete: { permission: () => 'delete-qhsse-pts', steps: workflowSteps },
}

const actionOrder = Object.keys(actionCatalog) as ActionName[]
const qhsseOperations = { update: 'update-qhsse-pts', delete: 'delete-qhsse-pts' } as const

function now() {
  return new Date().toISOString()
}

async function rowById(id: string, includeDeleted = false) {
  const conditions = [eq(qhssePts.id, id)]
  if (!includeDeleted) conditions.push(isNull(qhssePts.deletedAt))
  return (await getDb().select().from(qhssePts).where(and(...conditions)).limit(1))[0]
}

async function assertCoverage(id: string, userId: string) {
  const row = await rowById(id)
  if (!row) throw notFound()
  if (!(await hasProjectCoverage(userId, row.projectId))) throw notFound()
  return row
}

async function assertAccess(id: string, userId: string, permission: PermissionCode) {
  const row = await rowById(id)
  if (!row) throw notFound()
  await requireProjectRecord(userId, row.projectId, permission)
  return row
}

function withDetailOperation(allowed: Array<'detail' | 'update' | 'delete'>) {
  return ['detail', ...allowed.filter((operation) => operation !== 'detail')]
}

async function withAllowedOperations<T extends { projectId: string; statusCode: string; stepCode: string }>(userId: string, row: T) {
  const operations = await allowedProjectOperations(userId, [row.projectId], qhsseOperations)
  const allowed = withDetailOperation(operations.get(row.projectId) ?? [])
  return { ...row, allowedOperations: row.statusCode === 'open' && row.stepCode === 'report' ? allowed : allowed.filter((operation) => operation !== 'update') }
}

async function validateReferences(input: CreateReportInput, db = getDb()) {
  const [division, project, ptsCategory, categoryItem, workItem] = await Promise.all([
    db.select({ id: divisions.id, active: divisions.active }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1),
    db.select({ id: projects.id, divisionId: projects.divisionId, active: projects.active }).from(projects).where(eq(projects.id, input.projectId)).limit(1),
    db.select({ id: ptsWorkCategories.id, active: ptsWorkCategories.active }).from(ptsWorkCategories).where(eq(ptsWorkCategories.id, input.ptsWorkCategoryId)).limit(1),
    db.select({ id: workItems.id, projectId: workItems.projectId, parentId: workItems.parentId, active: workItems.active, categoryId: workItems.categoryId }).from(workItems).where(eq(workItems.id, input.workItemCategoryId)).limit(1),
    db.select({ id: workItems.id, projectId: workItems.projectId, parentId: workItems.parentId, active: workItems.active }).from(workItems).where(eq(workItems.id, input.workItemId)).limit(1),
  ])
  if (!division[0]?.active) throw validationError('Division is not active.')
  if (!project[0] || !project[0].active || project[0].divisionId !== input.divisionId) throw validationError('Project must be active and belong to the division.')
  if (!ptsCategory[0]?.active) throw validationError('PTS work category is not active.')
  if (!categoryItem[0] || !categoryItem[0].active || categoryItem[0].projectId !== input.projectId || categoryItem[0].parentId !== null || categoryItem[0].categoryId !== input.ptsWorkCategoryId) throw validationError('Work-item category is invalid for the project.')
  if (!workItem[0] || !workItem[0].active || workItem[0].projectId !== input.projectId) throw validationError('Work item must belong to the project.')

  const projectWorkItems = await db.select({ id: workItems.id, parentId: workItems.parentId }).from(workItems).where(and(eq(workItems.projectId, input.projectId), eq(workItems.active, true)))
  const children = new Set(projectWorkItems.map((item) => item.parentId).filter((value): value is string => Boolean(value)))
  if (children.has(input.workItemId)) throw validationError('A PTS report must use a leaf work item.')
  const parents = new Map(projectWorkItems.map((item) => [item.id, item.parentId]))
  let parentId = workItem[0].parentId
  let categoryMatches = false
  while (parentId) {
    if (parentId === categoryItem[0].id) {
      categoryMatches = true
      break
    }
    parentId = parents.get(parentId) ?? null
  }
  if (!categoryMatches) throw validationError('Work item must belong to the selected category.')

  const ids = [...new Set(input.rootCauseIds)]
  const causes = await db.select({ id: rootCauses.id }).from(rootCauses).where(and(inArray(rootCauses.id, ids), eq(rootCauses.active, true)))
  if (causes.length !== ids.length) throw validationError('All root causes must be active.')
}

async function allocateNumber(tx: any, projectId: string, date: Date, projectNumber: string, divisionCode: string) {
  const configs = await tx.select().from(numberConfigs).where(eq(numberConfigs.active, true)).orderBy(asc(numberConfigs.displayOrder))
  if (!configs.length) throw validationError('No active number configuration exists.')
  const year = date.getUTCFullYear()
  const counter = await tx.insert(qhssePtsNumberCounters).values({ projectId, year, lastNumber: 1 }).onConflictDoUpdate({
    target: [qhssePtsNumberCounters.projectId, qhssePtsNumberCounters.year],
    set: { lastNumber: sql`${qhssePtsNumberCounters.lastNumber} + 1` },
  }).returning({ lastNumber: qhssePtsNumberCounters.lastNumber })
  const sequence = counter[0]?.lastNumber ?? 1
  const month = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][date.getUTCMonth()]
  const values: Record<string, string> = {
    number: String(sequence),
    form_name: 'PTS',
    project_number: projectNumber,
    division_code: divisionCode,
    year: String(year),
    month,
  }
  const parts = configs.map((config: { numberVariableCode: string; numberOfDigits: number; customCode: string | null }) => {
    if (!(config.numberVariableCode in values) && config.numberVariableCode !== 'custom_code') throw validationError(`Unsupported number variable "${config.numberVariableCode}".`)
    const value = config.numberVariableCode === 'custom_code' ? config.customCode ?? '' : values[config.numberVariableCode]
    return config.numberVariableCode === 'number' ? value.padStart(config.numberOfDigits, '0') : value
  }).filter(Boolean)
  return { number: parts.join('/'), year }
}

async function addActivity(tx: any, row: Pick<PtsRow, 'id' | 'projectId' | 'divisionId' | 'statusCode' | 'stepCode'>, actorUserId: string, shortDescription: string, description?: string) {
  await tx.insert(activityLogs).values({
    actorUserId,
    projectId: row.projectId,
    divisionId: row.divisionId,
    moduleId: row.id,
    moduleName: 'qhsse-pts',
    referenceTable: 'qhsse_pts',
    referenceId: row.id,
    statusCode: row.statusCode,
    stepCode: row.stepCode,
    shortDescription,
    description,
  })
}

async function notifyNext(tx: any, row: Pick<PtsRow, 'id' | 'projectId' | 'number'>, actorUserId: string, permissionCode: PermissionCode, title: string) {
  const recipients = await tx.select({ userId: users.id }).from(users)
    .innerJoin(projectRoleAssignments, eq(projectRoleAssignments.userId, users.id))
    .innerJoin(projects, eq(projects.id, row.projectId))
    .innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .innerJoin(authorizationModules, eq(authorizationModules.id, permissions.moduleId))
    .where(and(
      or(
        eq(projectRoleAssignments.coverageType, 'all_projects'),
        and(eq(projectRoleAssignments.coverageType, 'division'), eq(projectRoleAssignments.divisionId, projects.divisionId)),
        and(eq(projectRoleAssignments.coverageType, 'project'), eq(projectRoleAssignments.projectId, row.projectId)),
      ),
      eq(projectRoleAssignments.active, true),
      eq(users.statusCode, 'active'),
      eq(roles.active, true),
      eq(roles.realm, 'project'),
      eq(rolePermissions.active, true),
      eq(permissions.active, true),
      eq(authorizationModules.active, true),
      eq(authorizationModules.realm, 'project'),
      eq(permissions.permissionCode, permissionCode),
    ))
  const ids = [...new Set(recipients.map(({ userId }: { userId: string }) => userId).filter((id: string) => id !== actorUserId))]
  if (ids.length) await tx.insert(notifications).values(ids.map((recipientUserId) => ({
    recipientUserId,
    projectId: row.projectId,
    moduleCode: 'qhsse-pts',
    referenceTable: 'qhsse_pts',
    referenceId: row.id,
    title,
    body: `PTS ${row.number} requires your action.`,
  })))
}

async function notifyUser(tx: any, row: Pick<PtsRow, 'id' | 'projectId' | 'number'>, actorUserId: string, recipientUserId: string, title: string) {
  if (recipientUserId === actorUserId) return
  await tx.insert(notifications).values({
    recipientUserId,
    projectId: row.projectId,
    moduleCode: 'qhsse-pts',
    referenceTable: 'qhsse_pts',
    referenceId: row.id,
    title,
    body: `PTS ${row.number} requires your action.`,
  })
}

async function projectUsers(tx: any, projectId: string) {
  return tx.selectDistinct({ id: users.id, name: users.name }).from(users)
    .innerJoin(projectRoleAssignments, eq(projectRoleAssignments.userId, users.id))
    .innerJoin(projects, eq(projects.id, projectId))
    .innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId))
    .where(and(
      eq(projectRoleAssignments.active, true),
      eq(users.statusCode, 'active'),
      eq(roles.active, true),
      eq(roles.realm, 'project'),
      or(
        eq(projectRoleAssignments.coverageType, 'all_projects'),
        and(eq(projectRoleAssignments.coverageType, 'division'), eq(projectRoleAssignments.divisionId, projects.divisionId)),
        and(eq(projectRoleAssignments.coverageType, 'project'), eq(projectRoleAssignments.projectId, projectId)),
      ),
    )).orderBy(asc(users.name))
}

async function requireProjectUser(tx: any, userId: string, projectId: string, label: string) {
  const rows = await projectUsers(tx, projectId)
  if (!rows.some((row: { id: string }) => row.id === userId)) throw validationError(`${label} must be an active project user.`)
}

function monthStart(value: unknown, name: string) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw validationError(`${name} must use YYYY-MM.`)
  return `${value}-01T00:00:00.000Z`
}

function nextMonth(value: string) {
  const [year, month] = value.slice(0, 7).split('-').map(Number)
  const date = new Date(Date.UTC(year, month, 1))
  return date.toISOString()
}

export async function createReport(userId: string, rawInput: unknown) {
  const input = createReportSchema.parse(rawInput)
  await requireProjectRecord(userId, input.projectId, 'create-qhsse-pts')
  await validateReferences(input)
  const date = new Date()
  const db = getDb()
  const row = await db.transaction(async (tx) => {
    const project = (await tx.select({ number: projects.number, divisionId: projects.divisionId }).from(projects).where(eq(projects.id, input.projectId)).limit(1))[0]
    const division = (await tx.select({ code: divisions.code }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1))[0]
    if (!project || !division) throw validationError('Project or division not found.')
    const allocated = await allocateNumber(tx, input.projectId, date, project.number, division.code)
    const { rootCauseIds, ...report } = input
    const inserted = await tx.insert(qhssePts).values({
      ...report,
      number: allocated.number,
      statusCode: 'open',
      stepCode: 'report',
      createdBy: userId,
      updatedBy: userId,
    }).returning()
    const saved = inserted[0]
    if (!saved) throw validationError('PTS report was not created.')
    await tx.insert(qhssePtsRootCauses).values([...new Set(rootCauseIds)].map((rootCauseId) => ({ qhssePtsId: saved.id, rootCauseId })))
    await addActivity(tx, saved, userId, 'PTS report created.')
    await notifyNext(tx, saved, userId, input.criteriaCode === 'low' ? 'low-disposition-qhsse-pts' : 'high-disposition-qhsse-pts', 'PTS disposition required')
    return saved
  })
  return withAllowedOperations(userId, qhssePtsEntity.schemas.select.parse(row))
}

export async function listReports(userId: string, query: Record<string, unknown>) {
  const conditions: SQL[] = [inArray(qhssePts.projectId, coveredProjectIds(userId)), isNull(qhssePts.deletedAt)]
  const projectId = typeof query.projectId === 'string' ? query.projectId : undefined
  const divisionId = typeof query.divisionId === 'string' ? query.divisionId : undefined
  const statusCode = typeof query.statusCode === 'string' ? query.statusCode : undefined
  const stepCode = typeof query.stepCode === 'string' ? query.stepCode : undefined
  const criteriaCode = typeof query.criteriaCode === 'string' ? query.criteriaCode : undefined
  const search = typeof query.search === 'string' && query.search ? `%${query.search}%` : undefined
  const start = monthStart(query.startMonth, 'startMonth')
  const end = typeof query.endMonth === 'string' ? nextMonth(monthStart(query.endMonth, 'endMonth')!) : undefined
  const page = Number(query.page)
  const limit = Number(query.limit)
  if (projectId) conditions.push(eq(qhssePts.projectId, projectId))
  if (divisionId) conditions.push(eq(qhssePts.divisionId, divisionId))
  if (statusCode) conditions.push(eq(qhssePts.statusCode, statusCode))
  if (stepCode) conditions.push(eq(qhssePts.stepCode, stepCode))
  if (criteriaCode) conditions.push(eq(qhssePts.criteriaCode, criteriaCode))
  if (start) conditions.push(gte(qhssePts.createdAt, start))
  if (end) conditions.push(lt(qhssePts.createdAt, end))
  if (search) conditions.push(or(ilike(qhssePts.number, search), ilike(qhssePts.location, search), ilike(qhssePts.description, search))!)
  if (typeof query.rootCauseId === 'string') {
    const ids = await getDb().select({ id: qhssePtsRootCauses.qhssePtsId }).from(qhssePtsRootCauses).where(eq(qhssePtsRootCauses.rootCauseId, query.rootCauseId))
    conditions.push(inArray(qhssePts.id, ids.map(({ id }) => id)))
  }
  const where = and(...conditions)
  const db = getDb()
  const workItemCategory = alias(workItems, 'qhsse_pts_list_work_item_category')
  const workItem = alias(workItems, 'qhsse_pts_list_work_item')
  const [rows, totalRows] = await Promise.all([
    db.select({ row: qhssePts, projectName: projects.name, divisionName: divisions.name, createdByName: users.name, ptsWorkCategoryName: ptsWorkCategories.name, workItemCategoryName: workItemCategory.name, workItemName: workItem.name }).from(qhssePts)
      .innerJoin(projects, eq(projects.id, qhssePts.projectId)).innerJoin(divisions, eq(divisions.id, qhssePts.divisionId)).innerJoin(users, eq(users.id, qhssePts.createdBy)).innerJoin(ptsWorkCategories, eq(ptsWorkCategories.id, qhssePts.ptsWorkCategoryId)).innerJoin(workItemCategory, eq(workItemCategory.id, qhssePts.workItemCategoryId)).innerJoin(workItem, eq(workItem.id, qhssePts.workItemId))
      .where(where).orderBy(desc(qhssePts.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(qhssePts).where(where),
  ])
  const operations = await allowedProjectOperations(userId, [...new Set(rows.map(({ row }) => row.projectId))], qhsseOperations)
  const reportIds = rows.map(({ row }) => row.id)
  const causes = reportIds.length ? await db.select({ qhssePtsId: qhssePtsRootCauses.qhssePtsId, id: rootCauses.id, code: rootCauses.code, name: rootCauses.name }).from(qhssePtsRootCauses).innerJoin(rootCauses, eq(rootCauses.id, qhssePtsRootCauses.rootCauseId)).where(inArray(qhssePtsRootCauses.qhssePtsId, reportIds)) : []
  const causesByReport = new Map<string, typeof causes>()
  for (const cause of causes) causesByReport.set(cause.qhssePtsId, [...(causesByReport.get(cause.qhssePtsId) ?? []), cause])
  return {
    data: rows.map(({ row, projectName, divisionName, createdByName, ptsWorkCategoryName, workItemCategoryName, workItemName }) => ({
      ...qhssePtsEntity.schemas.select.parse(row),
      projectName,
      divisionName,
      createdByName,
      ptsWorkCategoryName,
      workItemCategoryName,
      workItemName,
      rootCauses: causesByReport.get(row.id) ?? [],
      allowedOperations: row.statusCode === 'open' && row.stepCode === 'report' ? withDetailOperation(operations.get(row.projectId) ?? []) : withDetailOperation(operations.get(row.projectId) ?? []).filter((operation) => operation !== 'update'),
    })),
    total: Number(totalRows[0]?.value ?? 0),
  }
}

export async function availableActions(row: ActionRow, userId: string): Promise<ActionName[]> {
  const candidates = row.statusCode === 'close' ? ['delete' as const] : actionOrder
    .filter((action) => actionCatalog[action].steps.includes(row.stepCode))
    .filter((action) => action !== 'complete-report' || !row.somUserId)
    .filter((action) => action !== 'follow-up-implementation' || !row.implementationUserId)
    .filter((action) => action !== 'follow-up-price' || !row.estimationCost)
    .filter((action) => action !== 'implementation-report' || row.implementationUserId === userId)
  const granted = await allowedProjectPermissions(userId, [row.projectId], candidates.map((action) => actionCatalog[action].permission(row)))
  const permissionsForProject = granted.get(row.projectId) ?? new Set<PermissionCode>()
  return candidates.filter((action) => permissionsForProject.has(actionCatalog[action].permission(row)))
}

export async function getReport(userId: string, id: string) {
  const row = await assertCoverage(id, userId)
  const workItemCategory = alias(workItems, 'qhsse_pts_work_item_category')
  const workItem = alias(workItems, 'qhsse_pts_work_item')
  const [joined, rootCauseRows, activity, vendors] = await Promise.all([
    getDb().select({ project: { id: projects.id, number: projects.number, name: projects.name }, division: { id: divisions.id, code: divisions.code, name: divisions.name }, createdByUser: { id: users.id, name: users.name }, ptsWorkCategory: { id: ptsWorkCategories.id, code: ptsWorkCategories.code, name: ptsWorkCategories.name }, workItemCategory: { id: workItemCategory.id, code: workItemCategory.code, name: workItemCategory.name }, workItem: { id: workItem.id, code: workItem.code, name: workItem.name } }).from(qhssePts).innerJoin(projects, eq(projects.id, qhssePts.projectId)).innerJoin(divisions, eq(divisions.id, qhssePts.divisionId)).innerJoin(users, eq(users.id, qhssePts.createdBy)).innerJoin(ptsWorkCategories, eq(ptsWorkCategories.id, qhssePts.ptsWorkCategoryId)).innerJoin(workItemCategory, eq(workItemCategory.id, qhssePts.workItemCategoryId)).innerJoin(workItem, eq(workItem.id, qhssePts.workItemId)).where(eq(qhssePts.id, id)).limit(1),
    getDb().select({ id: rootCauses.id, code: rootCauses.code, name: rootCauses.name }).from(qhssePtsRootCauses).innerJoin(rootCauses, eq(rootCauses.id, qhssePtsRootCauses.rootCauseId)).where(eq(qhssePtsRootCauses.qhssePtsId, id)),
    getDb().select().from(activityLogs).where(and(eq(activityLogs.referenceTable, 'qhsse_pts'), eq(activityLogs.referenceId, id))).orderBy(desc(activityLogs.createdAt)),
    getDb().select({ id: projectVendors.id, name: projectVendors.name }).from(projectVendors).where(and(eq(projectVendors.projectId, row.projectId), eq(projectVendors.active, true))),
  ])
  const operations = await allowedProjectOperations(userId, [row.projectId], qhsseOperations)
  const relation = joined[0]
  return {
    ...qhssePtsEntity.schemas.select.parse(row),
    project: relation?.project,
    division: relation?.division,
    createdByUser: relation?.createdByUser,
    ptsWorkCategory: relation?.ptsWorkCategory,
    workItemCategory: relation ? { id: relation.workItemCategory.id, code: relation.workItemCategory.code, name: relation.workItemCategory.name } : undefined,
    workItem: relation?.workItem,
    rootCauses: rootCauseRows,
    activity,
    projectVendors: vendors,
    availableActions: await availableActions(row, userId),
    allowedOperations: row.statusCode === 'open' && row.stepCode === 'report' ? withDetailOperation(operations.get(row.projectId) ?? []) : withDetailOperation(operations.get(row.projectId) ?? []).filter((operation) => operation !== 'update'),
  }
}

export async function updateReport(userId: string, id: string, rawInput: unknown) {
  const current = await assertAccess(id, userId, 'update-qhsse-pts')
  if (current.stepCode !== 'report' || current.statusCode !== 'open') throw new HttpError(409, 'invalid_transition', 'Only open report-stage PTS rows can be updated.')
  const input = updateReportSchema.parse(rawInput)
  if (input.projectId && input.projectId !== current.projectId) await requireProjectRecord(userId, input.projectId, 'update-qhsse-pts')
  const rootCauseIds = input.rootCauseIds ?? (await getDb().select({ id: qhssePtsRootCauses.rootCauseId }).from(qhssePtsRootCauses).where(eq(qhssePtsRootCauses.qhssePtsId, id))).map(({ id: rootCauseId }) => rootCauseId)
  const merged = { ...current, ...input, rootCauseIds } as CreateReportInput
  await validateReferences(merged)
  const updated = await getDb().transaction(async (tx) => {
    const locked = (await tx.select().from(qhssePts).where(and(eq(qhssePts.id, id), isNull(qhssePts.deletedAt))).for('update'))[0]
    if (!locked || locked.stepCode !== 'report' || locked.statusCode !== 'open') throw new HttpError(409, 'invalid_transition', 'Only open report-stage PTS rows can be updated.')
    const { rootCauseIds: _rootCauseIds, ...values } = input
    const savedRows = await tx.update(qhssePts).set({ ...values, updatedBy: userId, updatedAt: now() }).where(eq(qhssePts.id, id)).returning()
    const saved = savedRows[0]
    if (!saved) throw notFound()
    if (input.rootCauseIds) {
      await tx.delete(qhssePtsRootCauses).where(eq(qhssePtsRootCauses.qhssePtsId, id))
      await tx.insert(qhssePtsRootCauses).values([...new Set(rootCauseIds)].map((rootCauseId) => ({ qhssePtsId: id, rootCauseId })))
    }
    await addActivity(tx, saved, userId, 'PTS report updated.')
    return saved
  })
  return getReport(userId, updated.id)
}

export function nextStep(row: PtsRow, action: ActionName, input: Record<string, unknown>) {
  if (action === 'disposition') {
    if (input.dispositionStatusCode === 'approved') return 'close'
    return row.criteriaCode === 'high' ? 'high-disposition' : 'low-disposition'
  }
  if (action === 'temporary-plan') return 'management-notes'
  if (action === 'management-notes' || action === 'complete-report') return 'complete-report'
  if (action === 'follow-up-implementation') return row.stepCode === 'follow-up-price' ? 'follow-up' : 'follow-up-implementation'
  if (action === 'follow-up-price') return row.stepCode === 'follow-up-implementation' ? 'follow-up' : 'follow-up-price'
  if (action === 'implementation-report') return 'implementation-report'
  if (action === 'verify-implementation') return input.implementationStatusCode === 'approved' ? 'approved-implementation' : 'follow-up'
  if (action === 'realization' || action === 'close') return action === 'close' ? 'close' : 'realization'
  return row.stepCode
}

async function notifyAfterAction(tx: any, row: PtsRow, previousStep: string, action: ActionName, actorUserId: string) {
  if (action === 'disposition' && row.statusCode === 'close') return notifyNext(tx, row, actorUserId, 'close-qhsse-pts', 'PTS completed')
  if (action === 'disposition' && row.stepCode === 'high-disposition') return notifyNext(tx, row, actorUserId, 'temporary-plan-qhsse-pts', 'PTS temporary plan required')
  if (action === 'disposition' && row.stepCode === 'low-disposition') return notifyNext(tx, row, actorUserId, 'complete-report-qhsse-pts', 'PTS report completion required')
  if (action === 'temporary-plan') return notifyNext(tx, row, actorUserId, 'management-notes-qhsse-pts', 'PTS management notes required')
  if (action === 'management-notes') return notifyNext(tx, row, actorUserId, 'complete-report-qhsse-pts', 'PTS report completion required')
  if (action === 'complete-report') {
    await notifyNext(tx, row, actorUserId, 'follow-up-implementation-qhsse-pts', 'PTS implementation follow-up required')
    return notifyNext(tx, row, actorUserId, 'follow-up-price-qhsse-pts', 'PTS price follow-up required')
  }
  if (action === 'follow-up-implementation') return row.stepCode === 'follow-up'
    ? notifyNext(tx, row, actorUserId, 'implementation-report-qhsse-pts', 'PTS implementation report required')
    : notifyNext(tx, row, actorUserId, 'follow-up-price-qhsse-pts', 'PTS price follow-up required')
  if (action === 'follow-up-price') return row.stepCode === 'follow-up'
    ? notifyNext(tx, row, actorUserId, 'implementation-report-qhsse-pts', 'PTS implementation report required')
    : notifyNext(tx, row, actorUserId, 'follow-up-implementation-qhsse-pts', 'PTS implementation follow-up required')
  if (action === 'implementation-report') return notifyNext(tx, row, actorUserId, 'verify-implementation-qhsse-pts', 'PTS implementation verification required')
  if (action === 'verify-implementation') {
    if (row.implementationStatusCode === 'rejected' && row.implementationUserId) return notifyUser(tx, row, actorUserId, row.implementationUserId, 'PTS implementation report rejected')
    if (row.implementationStatusCode === 'approved') return notifyNext(tx, row, actorUserId, 'realization-qhsse-pts', 'PTS realization required')
  }
  if (action === 'realization') return notifyNext(tx, row, actorUserId, 'close-qhsse-pts', 'PTS closure required')
  void previousStep
}

export async function performAction(userId: string, id: string, action: ActionName, rawInput: unknown) {
  const current = await assertCoverage(id, userId)
  const permission = actionCatalog[action].permission(current)
  await requireProjectRecord(userId, current.projectId, permission)
  const input = actionSchemas[action].parse(rawInput) as Record<string, unknown>
  const updated = await getDb().transaction(async (tx) => {
    const locked = (await tx.select().from(qhssePts).where(eq(qhssePts.id, id)).for('update'))[0]
    if (!locked) throw notFound()
    if (locked.deletedAt) throw new HttpError(409, 'invalid_transition', 'Deleted PTS reports cannot receive actions.')
    if (action !== 'delete' && locked.statusCode === 'close') throw new HttpError(409, 'invalid_transition', 'Closed PTS reports cannot receive actions.')
    if (!actionCatalog[action].steps.includes(locked.stepCode)) throw new HttpError(409, 'invalid_transition', `Action "${action}" is not available for this PTS row.`)
    if (action === 'complete-report' && locked.somUserId) throw new HttpError(409, 'invalid_transition', 'The PTS report is already complete.')

    if (action === 'complete-report') await requireProjectUser(tx, input.somUserId as string, locked.projectId, 'SOM user')
    if (action === 'follow-up-implementation') {
      await requireProjectUser(tx, input.implementationUserId as string, locked.projectId, 'Implementation user')
      if (locked.implementationUserId) throw new HttpError(409, 'invalid_transition', 'Implementation follow-up is already complete.')
    }
    if (action === 'follow-up-price' && locked.estimationCost) throw new HttpError(409, 'invalid_transition', 'Price follow-up is already complete.')
    if (action === 'follow-up-price' && input.jobImplementorType === 'vendor') {
      const vendor = await tx.select({ id: projectVendors.id }).from(projectVendors).where(and(eq(projectVendors.id, input.projectVendorId as string), eq(projectVendors.projectId, locked.projectId), eq(projectVendors.active, true))).limit(1)
      if (!vendor[0]) throw validationError('Project vendor is not active.')
    }
    if (action === 'implementation-report' && locked.implementationUserId !== userId) throw forbidden('Only the selected implementation user can submit the implementation report.')
    if (action === 'realization' && input.actualJobImplementorType === 'vendor') {
      const vendor = await tx.select({ id: projectVendors.id }).from(projectVendors).where(and(eq(projectVendors.id, input.actualProjectVendorId as string), eq(projectVendors.projectId, locked.projectId), eq(projectVendors.active, true))).limit(1)
      if (!vendor[0]) throw validationError('Project vendor is not active.')
    }
    if (action === 'implementation-report' && locked.implementationUserId) await requireProjectUser(tx, locked.implementationUserId, locked.projectId, 'Implementation user')

    const set: Record<string, unknown> = { updatedBy: userId, updatedAt: now(), stepCode: nextStep(locked, action, input), statusCode: action === 'disposition' && input.dispositionStatusCode === 'approved' || action === 'close' ? 'close' : 'on-progress' }
    if (action === 'disposition') Object.assign(set, { dispositionStatusCode: input.dispositionStatusCode })
    if (action === 'temporary-plan') Object.assign(set, { temporaryFollowUpPlan: input.temporaryFollowUpPlan })
    if (action === 'management-notes') Object.assign(set, { managementNotes: input.managementNotes })
    if (action === 'complete-report') Object.assign(set, { somUserId: input.somUserId, followUpPlan: input.followUpPlan, targetDate: input.targetDate })
    if (action === 'follow-up-implementation') Object.assign(set, { implementationUserId: input.implementationUserId, workMethod: input.workMethod })
    if (action === 'follow-up-price') Object.assign(set, { estimationCost: input.estimationCost, jobImplementorType: input.jobImplementorType, projectVendorId: input.projectVendorId ?? null })
    if (action === 'implementation-report') Object.assign(set, { implementationDate: input.implementationDate, imgProcess: input.imgProcess, imgAfter: input.imgAfter, implementationDescription: input.implementationDescription, implementationStatusCode: 'waiting' })
    if (action === 'verify-implementation') Object.assign(set, { implementationStatusCode: input.implementationStatusCode, implementationVerificationDescription: input.implementationVerificationDescription })
    if (action === 'realization') Object.assign(set, { actualCost: input.actualCost, actualJobImplementorType: input.actualJobImplementorType, actualProjectVendorId: input.actualProjectVendorId ?? null })
    if (action === 'delete') Object.assign(set, { deletedBy: userId, deletedAt: now(), deletedReason: input.deletedReason })

    const savedRows = await tx.update(qhssePts).set(set).where(eq(qhssePts.id, id)).returning()
    const saved = savedRows[0]
    if (!saved) throw notFound()
    await addActivity(tx, saved, userId, action === 'delete' ? 'PTS report deleted.' : `PTS ${action} completed.`)
    if (action !== 'delete') await notifyAfterAction(tx, saved, locked.stepCode, action, userId)
    return saved
  })
  if (action === 'delete') return { ...qhssePtsEntity.schemas.select.parse(updated), availableActions: [] as ActionName[] }
  return getReport(userId, id)
}
