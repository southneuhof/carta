import { forbidden, HttpError, notFound, validationError } from '@southneuhof/sprindle'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type { z } from 'zod/v4'
import { getDb } from '../../db'
import { hasProjectPermission } from '../../identity'
import { activityLogs, notifications } from '../notifications/notifications.entity'
import { permissions, projectUsers, rolePermissions, roles } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { divisions } from '../divisions/divisions.entity'
import { numberConfigs } from '../number-configs/number-configs.entity'
import { projects } from '../projects/projects.entity'
import { projectVendors } from '../project-vendors/project-vendors.entity'
import { ptsWorkCategories } from '../pts-work-categories/pts-work-categories.entity'
import { rootCauses } from '../root-causes/root-causes.entity'
import { workItems } from '../work-items/work-items.entity'
import { qhssePts, qhssePtsEntity, qhssePtsNumberCounters, qhssePtsRootCauses } from './qhsse-pts.entity'
import { actionSchemas, createReportSchema, updateReportSchema, type ActionName, type ActionInput, type CreateReportInput, type UpdateReportInput } from './qhsse-pts.schemas'
export { actionSchemas, createReportSchema, updateReportSchema }
export type { ActionName, ActionInput, CreateReportInput, UpdateReportInput }

const actionPermissions: Record<ActionName, string> = {
  disposition: 'disposition-qhsse-pts',
  'temporary-plan': 'temporary-plan-qhsse-pts',
  'management-notes': 'management-notes-qhsse-pts',
  'complete-analysis': 'complete-report-qhsse-pts',
  'follow-up-implementation': 'follow-up-implementation-qhsse-pts',
  'follow-up-price': 'follow-up-price-qhsse-pts',
  'implementation-report': 'implementation-report-qhsse-pts',
  verification: 'verify-implementation-qhsse-pts',
  realization: 'realization-qhsse-pts',
  close: 'close-qhsse-pts',
}

const transitions: Record<ActionName, string> = {
  disposition: 'report',
  'temporary-plan': 'temporary-plan',
  'management-notes': 'management-notes',
  'complete-analysis': 'analysis',
  'follow-up-implementation': 'follow-up',
  'follow-up-price': 'follow-up',
  'implementation-report': 'implementation',
  verification: 'verification',
  realization: 'realization',
  close: 'close',
}

const actionOrder: ActionName[] = [
  'disposition',
  'temporary-plan',
  'management-notes',
  'complete-analysis',
  'follow-up-implementation',
  'follow-up-price',
  'implementation-report',
  'verification',
  'realization',
  'close',
]

function now() {
  return new Date().toISOString()
}

async function rowById(id: string) {
  return (await getDb().select().from(qhssePts).where(eq(qhssePts.id, id)).limit(1))[0]
}

async function assertAccess(id: string, userId: string, permission = 'view-qhsse-pts') {
  const row = await rowById(id)
  if (!row) throw notFound()
  if (!(await hasProjectPermission(userId, row.projectId, permission))) throw forbidden()
  return row
}

async function validateReferences(input: CreateReportInput) {
  const db = getDb()
  const [division, project, category, categoryItem, workItem] = await Promise.all([
    db.select({ id: divisions.id, active: divisions.active }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1),
    db
      .select({
        id: projects.id,
        divisionId: projects.divisionId,
        active: projects.active,
      })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1),
    db.select({ id: ptsWorkCategories.id, active: ptsWorkCategories.active }).from(ptsWorkCategories).where(eq(ptsWorkCategories.id, input.ptsWorkCategoryId)).limit(1),
    db
      .select({
        id: workItems.id,
        projectId: workItems.projectId,
        active: workItems.active,
        parentId: workItems.parentId,
      })
      .from(workItems)
      .where(eq(workItems.id, input.workItemCategoryId))
      .limit(1),
    db
      .select({
        id: workItems.id,
        projectId: workItems.projectId,
        active: workItems.active,
        parentId: workItems.parentId,
      })
      .from(workItems)
      .where(eq(workItems.id, input.workItemId))
      .limit(1),
  ])
  if (!division[0]?.active) throw validationError('Division is not active.')
  if (!project[0] || !project[0].active || project[0].divisionId !== input.divisionId) throw validationError('Project must be active and belong to the division.')
  if (!category[0]?.active) throw validationError('PTS work category is not active.')
  if (!categoryItem[0] || !categoryItem[0].active || categoryItem[0].projectId !== input.projectId) throw validationError('Work-item category must belong to the project.')
  if (!workItem[0] || !workItem[0].active || workItem[0].projectId !== input.projectId) throw validationError('Work item must belong to the project.')
  const projectWorkItems = await getDb()
    .select({ id: workItems.id, parentId: workItems.parentId })
    .from(workItems)
    .where(and(eq(workItems.projectId, input.projectId), eq(workItems.active, true)))
  const children = new Set(projectWorkItems.map((item) => item.parentId).filter(Boolean))
  if (children.has(input.workItemId)) throw validationError('A PTS report must use a leaf work item.')
  let parentId = workItem[0].parentId
  let categoryMatches = false
  const parents = new Map(projectWorkItems.map((item) => [item.id, item.parentId]))
  while (parentId) {
    if (parentId === categoryItem[0].id) {
      categoryMatches = true
      break
    }
    parentId = parents.get(parentId) ?? null
  }
  if (!categoryMatches) throw validationError('Work item must belong to the selected category.')
  const causes = await getDb()
    .select({ id: rootCauses.id })
    .from(rootCauses)
    .where(and(inArray(rootCauses.id, input.rootCauseIds), eq(rootCauses.active, true)))
  if (new Set(causes.map(({ id }) => id)).size !== new Set(input.rootCauseIds).size) throw validationError('All root causes must be active.')
}

async function allocateNumber(tx: typeof getDb extends never ? never : any, projectId: string, date: string, projectNumber: string, divisionCode: string) {
  const configs = await tx.select().from(numberConfigs).where(eq(numberConfigs.active, true)).orderBy(asc(numberConfigs.displayOrder))
  if (!configs.length) throw validationError('No active number configuration exists.')
  const year = Number(date.slice(0, 4))
  const counter = await tx
    .insert(qhssePtsNumberCounters)
    .values({ projectId, year, lastNumber: 1 })
    .onConflictDoUpdate({
      target: [qhssePtsNumberCounters.projectId, qhssePtsNumberCounters.year],
      set: { lastNumber: sql`${qhssePtsNumberCounters.lastNumber} + 1` },
    })
    .returning({ lastNumber: qhssePtsNumberCounters.lastNumber })
  const number = counter[0]?.lastNumber ?? 1
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][Math.max(0, Number(date.slice(5, 7)) - 1)] ?? 'I'
  const values: Record<string, string> = {
    number: String(number),
    form_name: 'PTS',
    project_number: projectNumber,
    division_code: divisionCode,
    year: String(year),
    month: roman,
  }
  const parts = configs
    .map((config: { numberVariableCode: string; numberOfDigits: number; customCode: string | null }) => {
      if (!(config.numberVariableCode in values) && config.numberVariableCode !== 'custom_code') throw validationError(`Unsupported number variable "${config.numberVariableCode}".`)
      const value = config.numberVariableCode === 'custom_code' ? config.customCode ?? '' : values[config.numberVariableCode]
      return config.numberVariableCode === 'number' ? value.padStart(config.numberOfDigits, '0') : value
    })
    .filter(Boolean)
  return { number: parts.join('/'), year }
}

async function addActivity(
  tx: any,
  row: {
    id: string
    projectId: string
    divisionId: string
    statusCode: string
    stepCode: string
  },
  actorUserId: string,
  shortDescription: string
) {
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
  })
}

async function notifyNext(tx: any, row: { id: string; projectId: string; number: string }, actorUserId: string, permissionCode: string, title: string) {
  const recipients = await tx
    .select({ userId: projectUsers.userId })
    .from(projectUsers)
    .innerJoin(users, eq(users.id, projectUsers.userId))
    .innerJoin(roles, eq(roles.id, projectUsers.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(projectUsers.projectId, row.projectId),
        eq(projectUsers.active, true),
        eq(users.statusCode, 'active'),
        eq(roles.active, true),
        eq(roles.assignmentScope, 'project'),
        eq(rolePermissions.active, true),
        eq(permissions.active, true),
        eq(permissions.permissionCode, permissionCode)
      )
    )
  const ids = [...new Set(recipients.map(({ userId }: { userId: string }) => userId).filter((userId: string) => userId !== actorUserId))]
  if (ids.length)
    await tx.insert(notifications).values(
      ids.map((recipientUserId) => ({
        recipientUserId,
        projectId: row.projectId,
        moduleCode: 'qhsse-pts',
        referenceTable: 'qhsse_pts',
        referenceId: row.id,
        title,
        body: `PTS ${row.number} requires your action.`,
      }))
    )
}

export async function createReport(userId: string, rawInput: unknown) {
  const input = createReportSchema.parse(rawInput)
  if (!(await hasProjectPermission(userId, input.projectId, 'create-qhsse-pts'))) throw forbidden()
  await validateReferences(input)
  const db = getDb()
  return db.transaction(async (tx) => {
    const project = (await tx.select({ number: projects.number, divisionId: projects.divisionId }).from(projects).where(eq(projects.id, input.projectId)).limit(1))[0]
    const division = (await tx.select({ code: divisions.code }).from(divisions).where(eq(divisions.id, input.divisionId)).limit(1))[0]
    if (!project || !division) throw validationError('Project or division not found.')
    const allocated = await allocateNumber(tx, input.projectId, input.date, project.number, division.code)
    const { rootCauseIds: _rootCauseIds, ...report } = input
    const inserted = await tx
      .insert(qhssePts)
      .values({
        ...report,
        number: allocated.number,
        source: 'pts-report',
        statusCode: 'open',
        stepCode: 'report',
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()
    const row = inserted[0]
    if (!row) throw validationError('PTS report was not created.')
    await tx.insert(qhssePtsRootCauses).values(
      [...new Set(input.rootCauseIds)].map((rootCauseId) => ({
        qhssePtsId: row.id,
        rootCauseId,
      }))
    )
    await addActivity(tx, row, userId, 'PTS report created.')
    await notifyNext(tx, row, userId, 'disposition-qhsse-pts', 'PTS disposition required')
    return qhssePtsEntity.schemas.select.parse(row)
  })
}

export async function listReports(userId: string, query: Record<string, string | undefined>) {
  const rows = await getDb()
    .select({
      row: qhssePts,
      projectName: projects.name,
      divisionName: divisions.name,
    })
    .from(qhssePts)
    .innerJoin(projects, eq(projects.id, qhssePts.projectId))
    .innerJoin(divisions, eq(divisions.id, qhssePts.divisionId))
    .orderBy(desc(qhssePts.createdAt))
  // ponytail: one authorization query per row; replace with a scoped SQL view when list volume requires it.
  const allowed: Array<
    z.output<typeof qhssePtsEntity.schemas.select> & {
      projectName: string
      divisionName: string
    }
  > = []
  for (const item of rows) {
    const row = item.row
    if (query.projectId && row.projectId !== query.projectId) continue
    if (query.divisionId && row.divisionId !== query.divisionId) continue
    if (query.statusCode && row.statusCode !== query.statusCode) continue
    if (query.stepCode && row.stepCode !== query.stepCode) continue
    if (query.criteriaCode && row.criteriaCode !== query.criteriaCode) continue
    if (query.search && !`${row.number} ${row.description}`.toLowerCase().includes(query.search.toLowerCase())) continue
    if (await hasProjectPermission(userId, row.projectId, 'view-qhsse-pts'))
      allowed.push({
        ...qhssePtsEntity.schemas.select.parse(row),
        projectName: item.projectName,
        divisionName: item.divisionName,
      })
  }
  return allowed
}

export async function listLookups(userId: string, projectId?: string) {
  const db = getDb()
  const projectRows = await db
    .select({
      id: projects.id,
      number: projects.number,
      name: projects.name,
      divisionId: projects.divisionId,
      active: projects.active,
    })
    .from(projects)
    .where(eq(projects.active, true))
  const allowedProjects = [] as typeof projectRows
  for (const project of projectRows) {
    if (projectId && project.id !== projectId) continue
    if (await hasProjectPermission(userId, project.id, 'create-qhsse-pts')) allowedProjects.push(project)
  }
  if (projectId && !allowedProjects.length) throw forbidden()
  const projectIds = allowedProjects.map((project) => project.id)
  const [divisionRows, workItemRows, categoryRows, rootCauseRows, vendorRows] = await Promise.all([
    db
      .select({
        id: divisions.id,
        code: divisions.code,
        name: divisions.name,
      })
      .from(divisions)
      .where(eq(divisions.active, true)),
    projectIds.length
      ? db
          .select({
            id: workItems.id,
            code: workItems.code,
            name: workItems.name,
            projectId: workItems.projectId,
            parentId: workItems.parentId,
            active: workItems.active,
          })
          .from(workItems)
          .where(and(eq(workItems.active, true), inArray(workItems.projectId, projectIds)))
      : Promise.resolve([]),
    db
      .select({
        id: ptsWorkCategories.id,
        code: ptsWorkCategories.code,
        name: ptsWorkCategories.name,
      })
      .from(ptsWorkCategories)
      .where(eq(ptsWorkCategories.active, true)),
    db
      .select({
        id: rootCauses.id,
        code: rootCauses.code,
        name: rootCauses.name,
      })
      .from(rootCauses)
      .where(eq(rootCauses.active, true)),
    projectIds.length
      ? db
          .select({
            id: projectVendors.id,
            projectId: projectVendors.projectId,
            name: projectVendors.name,
          })
          .from(projectVendors)
          .where(and(eq(projectVendors.active, true), inArray(projectVendors.projectId, projectIds)))
      : Promise.resolve([]),
  ])
  const allowedDivisionIds = new Set(allowedProjects.map((project) => project.divisionId))
  return {
    divisions: divisionRows.filter((division) => allowedDivisionIds.has(division.id)),
    projects: allowedProjects,
    workItems: workItemRows,
    ptsWorkCategories: categoryRows,
    rootCauses: rootCauseRows,
    projectVendors: vendorRows,
  }
}

export async function availableActions(row: { id: string; projectId: string; statusCode: string; stepCode: string }, userId: string): Promise<ActionName[]> {
  if (row.statusCode === 'closed') return []
  const candidates = actionOrder
    .filter((action) => transitions[action] === row.stepCode)
    .filter((action) => action !== 'follow-up-implementation' || !('followUpImplementationDoneAt' in row) || !row.followUpImplementationDoneAt)
    .filter((action) => action !== 'follow-up-price' || !('followUpPriceDoneAt' in row) || !row.followUpPriceDoneAt)
  const actions: ActionName[] = []
  for (const action of candidates) if (await hasProjectPermission(userId, row.projectId, actionPermissions[action])) actions.push(action)
  return actions
}

export async function getReport(userId: string, id: string) {
  const row = await assertAccess(id, userId, 'show-qhsse-pts')
  const [rootCauseRows, activity, project, division, vendors] = await Promise.all([
    getDb()
      .select({
        id: rootCauses.id,
        code: rootCauses.code,
        name: rootCauses.name,
      })
      .from(qhssePtsRootCauses)
      .innerJoin(rootCauses, eq(rootCauses.id, qhssePtsRootCauses.rootCauseId))
      .where(eq(qhssePtsRootCauses.qhssePtsId, id)),
    getDb()
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.referenceTable, 'qhsse_pts'), eq(activityLogs.referenceId, id)))
      .orderBy(desc(activityLogs.createdAt)),
    getDb().select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, row.projectId)).limit(1),
    getDb().select({ id: divisions.id, name: divisions.name }).from(divisions).where(eq(divisions.id, row.divisionId)).limit(1),
    getDb()
      .select({ id: projectVendors.id, name: projectVendors.name })
      .from(projectVendors)
      .where(and(eq(projectVendors.projectId, row.projectId), eq(projectVendors.active, true))),
  ])
  return {
    ...qhssePtsEntity.schemas.select.parse(row),
    project: project[0],
    division: division[0],
    rootCauses: rootCauseRows,
    activity,
    projectVendors: vendors,
    availableActions: await availableActions(row, userId),
  }
}

export async function updateReport(userId: string, id: string, rawInput: unknown) {
  const row = await assertAccess(id, userId, 'update-qhsse-pts')
  if (row.stepCode !== 'report' || row.statusCode === 'closed') throw new HttpError(409, 'invalid_transition', 'Only report-stage PTS rows can be updated.')
  const input = updateReportSchema.parse(rawInput)
  if (input.projectId || input.divisionId || input.workItemId || input.workItemCategoryId) {
    await validateReferences({
      ...row,
      ...input,
      rootCauseIds: [],
    } as CreateReportInput)
  }
  const updated = await getDb()
    .update(qhssePts)
    .set({ ...input, updatedBy: userId, updatedAt: now() })
    .where(eq(qhssePts.id, id))
    .returning()
  return updated[0] ? qhssePtsEntity.schemas.select.parse(updated[0]) : null
}

export function nextStep(
  row: Pick<typeof qhssePts.$inferSelect, 'criteriaCode' | 'followUpImplementationDoneAt' | 'followUpPriceDoneAt' | 'stepCode'>,
  action: ActionName,
  input: Record<string, unknown>
) {
  if (action === 'disposition') return input.dispositionStatusCode === 'high' || row.criteriaCode === 'high' ? 'temporary-plan' : 'analysis'
  if (action === 'temporary-plan') return 'management-notes'
  if (action === 'management-notes') return 'analysis'
  if (action === 'complete-analysis') return 'follow-up'
  if (action === 'implementation-report') return 'verification'
  if (action === 'verification') return input.decision === 'approve' ? 'realization' : 'implementation'
  if (action === 'realization') return 'close'
  if (action === 'close') return 'closed'
  if (action === 'follow-up-implementation' && row.followUpPriceDoneAt) return 'implementation'
  if (action === 'follow-up-price' && row.followUpImplementationDoneAt) return 'implementation'
  return row.stepCode
}

export async function performAction(userId: string, id: string, action: ActionName, rawInput: unknown) {
  await assertAccess(id, userId, actionPermissions[action])
  const input = actionSchemas[action].parse(rawInput) as Record<string, unknown>
  await getDb().transaction(async (tx) => {
    const locked = await tx.select().from(qhssePts).where(eq(qhssePts.id, id)).for('update')
    const row = locked[0]
    if (!row) throw notFound()
    if (row.stepCode !== transitions[action] || row.statusCode === 'closed') throw new HttpError(409, 'invalid_transition', `Action "${action}" is not available for this PTS row.`)
    if (action === 'follow-up-implementation' && row.followUpImplementationDoneAt) throw new HttpError(409, 'invalid_transition', 'Implementation follow-up is already complete.')
    if (action === 'follow-up-price' && row.followUpPriceDoneAt) throw new HttpError(409, 'invalid_transition', 'Price follow-up is already complete.')
    if (action === 'realization') {
      const vendor = await tx
        .select({ id: projectVendors.id })
        .from(projectVendors)
        .where(and(eq(projectVendors.id, input.vendorId as string), eq(projectVendors.projectId, row.projectId), eq(projectVendors.active, true)))
        .limit(1)
      if (!vendor[0]) throw validationError('Project vendor is not active.')
    }
    const set: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: now(),
      stepCode: nextStep(row, action, input),
    }
    if (action === 'disposition')
      Object.assign(set, {
        dispositionStatusCode: input.dispositionStatusCode,
        dispositionNotes: input.notes,
      })
    if (action === 'temporary-plan')
      Object.assign(set, {
        temporaryPlan: input.temporaryPlan,
        temporaryPlanTargetDate: input.targetDate,
      })
    if (action === 'management-notes')
      Object.assign(set, {
        managementNotes: input.managementNotes,
        managementNotesTargetDate: input.targetDate,
      })
    if (action === 'complete-analysis')
      Object.assign(set, {
        analysis: input.analysis,
        analysisTargetDate: input.targetDate,
      })
    if (action === 'follow-up-implementation')
      Object.assign(set, {
        implementationPlan: input.implementationPlan,
        implementationPlanTargetDate: input.targetDate,
        followUpImplementationDoneAt: now(),
      })
    if (action === 'follow-up-price')
      Object.assign(set, {
        priceFollowUp: input.priceFollowUp,
        priceFollowUpTargetDate: input.targetDate,
        priceFollowUpCost: input.cost,
        followUpPriceDoneAt: now(),
      })
    if (action === 'implementation-report')
      Object.assign(set, {
        implementationReport: input.implementationReport,
        implementationDate: input.implementationDate,
        implementationCost: input.cost,
        imgProcess: input.imgProcess,
        imgAfter: input.imgAfter,
      })
    if (action === 'verification')
      Object.assign(set, {
        verificationStatusCode: input.decision,
        verificationNotes: input.notes,
      })
    if (action === 'realization')
      Object.assign(set, {
        realization: input.realization,
        realizationDate: input.date,
        actualCost: input.actualCost,
        vendorId: input.vendorId,
      })
    if (action === 'close')
      Object.assign(set, {
        closeNotes: input.closeNotes,
        closeDate: input.closeDate,
        statusCode: 'closed',
      })
    const next = set.stepCode as string
    const updated = await tx.update(qhssePts).set(set).where(eq(qhssePts.id, id)).returning()
    const saved = updated[0]
    if (!saved) throw notFound()
    await addActivity(tx, saved, userId, `PTS ${action} completed.`)
    const nextAction =
      next === 'temporary-plan'
        ? 'temporary-plan'
        : next === 'management-notes'
        ? 'management-notes'
        : next === 'analysis'
        ? 'complete-analysis'
        : next === 'follow-up'
        ? action === 'follow-up-implementation'
          ? 'follow-up-price'
          : 'follow-up-implementation'
        : next === 'implementation'
        ? 'implementation-report'
        : next === 'verification'
        ? 'verification'
        : next === 'realization'
        ? 'realization'
        : next === 'close'
        ? 'close'
        : undefined
    if (next === 'follow-up' && action === 'complete-analysis') {
      await notifyNext(tx, saved, userId, actionPermissions['follow-up-implementation'], 'PTS follow-up implementation required')
      await notifyNext(tx, saved, userId, actionPermissions['follow-up-price'], 'PTS follow-up price required')
    } else if (nextAction) {
      await notifyNext(tx, saved, userId, actionPermissions[nextAction], `PTS ${nextAction} required`)
    }
  })
  return getReport(userId, id)
}

export async function deleteReport(userId: string, id: string) {
  const row = await assertAccess(id, userId, 'delete-qhsse-pts')
  if (row.stepCode !== 'report') throw new HttpError(409, 'invalid_transition', 'Only report-stage PTS rows can be deleted.')
  const deleted = await getDb().delete(qhssePts).where(eq(qhssePts.id, id)).returning({ id: qhssePts.id })
  return Boolean(deleted[0])
}
