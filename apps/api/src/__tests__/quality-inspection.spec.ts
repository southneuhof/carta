import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { and, eq, inArray } from 'drizzle-orm'
import { closeDb, getDb } from '../db'
import { authorizationModules, permissions, projectRoleAssignments, rolePermissions, roles, systemRoleAssignments } from '../routes/roles/roles.entity'
import { activityLogs, notifications } from '../routes/notifications/notifications.entity'
import { businessCategories } from '../routes/business-categories/business-categories.entity'
import { divisions } from '../routes/divisions/divisions.entity'
import { inspectionTestPlanInspectorPoints, inspectionTestPlanInspectorTypes, inspectionTestPlans, itpInspectionPoints, itpInspectorTypes } from '../routes/inspection-test-plans/inspection-test-plans.entity'
import { numberConfigs } from '../routes/number-configs/number-configs.entity'
import { numberVariables } from '../routes/number-variables/number-variables.entity'
import { projects } from '../routes/projects/projects.entity'
import { ptsWorkCategories } from '../routes/pts-work-categories/pts-work-categories.entity'
import { qhssePts, qhssePtsEntity, qhssePtsRootCauses } from '../routes/qhsse-pts/qhsse-pts.entity'
import { performAction } from '../routes/qhsse-pts/qhsse-pts.service'
import { actionSchemas } from '../routes/qhsse-pts/qhsse-pts.schemas'
import { rootCauses } from '../routes/root-causes/root-causes.entity'
import { uoms } from '../routes/uoms/uoms.entity'
import { users } from '../routes/users/users.entity'
import { workItems } from '../routes/work-items/work-items.entity'
import { workItemSchedules, qualityInspectionDocumentations, qualityInspectionVerifications, qualityInspections } from '../routes/quality-inspection/quality-inspection.entity'
import { createQualityInspectionSchema, qualityInspectionListQuerySchema, selectedWorkItemSchema, submitQualityInspectionDocumentationsSchema, type SelectedWorkItemInput } from '../routes/quality-inspection/quality-inspection.schemas'
import { completeReportQualityInspection, createQualityInspection, getQualityInspection, listQualityInspectionSchedules, listQualityInspections, loadQualityInspectionCreateContext, scheduleCreateContext, submitQualityInspectionDocumentations, updateQualityInspection, verifyQualityInspection, verifyQualityInspectionWorkItemItp } from '../routes/quality-inspection/quality-inspection.service'

function id(name: string) {
  return `qi-test-${name}-${crypto.randomUUID()}`
}

type Fixture = {
  db: ReturnType<typeof getDb>
  actorId: string
  verifierId: string
  projectModuleId: string
  systemModuleId: string
  projectRoleId: string
  systemRoleId: string
  businessCategoryId: string
  divisionId: string
  projectId: string
  qualityCategoryId: string
  uomId: string
  rootId: string
  leafOneId: string
  leafTwoId: string
  rootCauseId: string
  inspectorTypeId: string
  pointCode: string
  itpOneId: string
  itpTwoId: string
  itpProductId: string
  itpLeafTwoId: string
  numberConfigId: string
  formNameConfigId: string
  scheduleId: string
  inspectorAssignmentIds: string[]
}
const fixtures: Fixture[] = []

async function makeFixture(): Promise<Fixture> {
  const db = getDb()
  const actorId = id('actor')
  const verifierId = id('verifier')
  const projectModuleId = id('project-module')
  const systemModuleId = id('system-module')
  const projectRoleId = id('project-role')
  const systemRoleId = id('system-role')
  const businessCategoryId = id('business-category')
  const divisionId = id('division')
  const projectId = id('project')
  const qualityCategoryId = id('quality-category')
  const uomId = id('uom')
  const rootId = id('root')
  const leafOneId = id('leaf-one')
  const leafTwoId = id('leaf-two')
  const rootCauseId = id('root-cause')
  const inspectorTypeId = id('inspector-type')
  const inspectorTypeCode = id('inspector-type-code')
  const pointCode = id('point-code')
  const itpOneId = id('itp-one')
  const itpTwoId = id('itp-two')
  const itpProductId = id('itp-product')
  const itpLeafTwoId = id('itp-leaf-two')
  const numberConfigId = id('number-config')
  const formNameConfigId = id('form-name-config')
  const scheduleId = id('schedule')
  const permissionCodes = [
    'create-quality-inspection', 'update-quality-inspection', 'delete-quality-inspection',
    'complete-report-quality-inspection', 'verify-quality-inspection-work-item-itp',
    'submit-quality-inspection-documentations', 'verify-quality-inspection', 'complete-qi-report-qhsse-pts',
  ]
  const systemCodes = ['view-quality-inspection', 'show-quality-inspection']

  await db.insert(users).values([
    { id: actorId, name: 'QI Test User', email: `${actorId}@example.invalid` },
    { id: verifierId, name: 'QI Second Verifier', email: `${verifierId}@example.invalid` },
  ])
  await db.insert(authorizationModules).values([
    { id: projectModuleId, code: id('project-module-code'), name: 'QI workflow', realm: 'project' },
    { id: systemModuleId, code: id('system-module-code'), name: 'QI reads', realm: 'system' },
  ])
  await db.insert(roles).values([
    { id: projectRoleId, roleCode: id('project-role-code'), name: 'QI project role', realm: 'project' },
    { id: systemRoleId, roleCode: id('system-role-code'), name: 'QI system role', realm: 'system' },
  ])
  await db.insert(permissions).values([
    ...permissionCodes.map((permissionCode) => ({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId: projectModuleId })),
    ...systemCodes.map((permissionCode) => ({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId: systemModuleId })),
  ]).onConflictDoNothing()
  const projectPermissionRows = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.permissionCode, permissionCodes))
  const systemPermissionRows = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.permissionCode, systemCodes))
  await db.insert(rolePermissions).values(projectPermissionRows.map(({ id: permissionId }) => ({ roleId: projectRoleId, permissionId }))).onConflictDoNothing()
  await db.insert(rolePermissions).values(systemPermissionRows.map(({ id: permissionId }) => ({ roleId: systemRoleId, permissionId }))).onConflictDoNothing()
  await db.insert(systemRoleAssignments).values([{ userId: actorId, roleId: systemRoleId }, { userId: verifierId, roleId: systemRoleId }]).onConflictDoNothing()
  await db.insert(businessCategories).values({ id: businessCategoryId, code: id('business-code'), name: 'QI Business' })
  await db.insert(divisions).values({ id: divisionId, businessCategoryId, code: id('division-code'), name: 'QI Division' })
  await db.insert(projects).values({ id: projectId, divisionId, number: id('project-number'), integrationCode: id('integration'), name: 'QI Project' })
  await db.insert(projectRoleAssignments).values([
    { id: id('assignment'), userId: actorId, roleId: projectRoleId, coverageType: 'project', projectId },
    { id: id('assignment'), userId: verifierId, roleId: projectRoleId, coverageType: 'project', projectId },
  ])
  await db.insert(ptsWorkCategories).values({ id: qualityCategoryId, code: id('quality-code'), name: 'QI Category' })
  await db.insert(uoms).values({ id: uomId, code: id('uom-code'), name: 'm³', uomType: 'work-items' })
  await db.insert(workItems).values([
    { id: rootId, projectId, categoryId: qualityCategoryId, code: id('root-code'), name: 'QI Root', volume: '10', uomId, isHighRisk: true },
    { id: leafOneId, projectId, parentId: rootId, code: id('leaf-one-code'), name: 'QI Leaf One', volume: '2', uomId },
    { id: leafTwoId, projectId, parentId: rootId, code: id('leaf-two-code'), name: 'QI Leaf Two', volume: '3', uomId },
  ])
  await db.insert(rootCauses).values({ id: rootCauseId, code: id('cause-code'), name: 'QI Root Cause' })
  await db.insert(itpInspectorTypes).values({ id: inspectorTypeId, code: inspectorTypeCode, name: 'Inspector', active: true })
  await db.insert(itpInspectionPoints).values({ id: id('point'), code: pointCode, name: 'Inspection Point', active: true })
  await db.insert(inspectionTestPlans).values([
    { id: itpOneId, workItemId: leafOneId, type: 'material', criteria: 'C-1', procedureCode: 'P-1', specification: 'S-1', method: 'M-1', frequency: 1, imgDocumentation: 'uploads/itp-material.jpg', description: 'D-1', active: true },
    { id: itpTwoId, workItemId: leafOneId, type: 'process', criteria: 'C-2', procedureCode: 'P-2', specification: 'S-2', method: 'M-2', frequency: 2, description: 'D-2', active: true },
    { id: itpProductId, workItemId: leafOneId, type: 'product', criteria: 'C-3', procedureCode: 'P-3', specification: 'S-3', method: 'M-3', frequency: 3, description: 'D-3', active: true },
    { id: itpLeafTwoId, workItemId: leafTwoId, type: 'material', criteria: 'C-4', procedureCode: 'P-4', specification: 'S-4', method: 'M-4', frequency: 1, description: 'D-4', active: true },
  ])
  const inspectorAssignments = [itpOneId, itpTwoId, itpProductId].map((inspectionTestPlanId) => ({ id: id('itp-inspector'), inspectionTestPlanId, inspectorTypeId, active: true }))
  await db.insert(inspectionTestPlanInspectorTypes).values(inspectorAssignments)
  await db.insert(inspectionTestPlanInspectorPoints).values(inspectorAssignments.map(({ id: inspectionTestPlanInspectorTypeId }) => ({ id: id('itp-point'), inspectionTestPlanInspectorTypeId, inspectionPointCode: pointCode, value: true, active: true })))
  await db.insert(workItemSchedules).values({ id: scheduleId, projectId, workItemId: rootId, startDate: '2026-08-01', endDate: '2026-08-31', active: true, createdByUserId: actorId, updatedByUserId: actorId })
  await db.insert(numberVariables).values([
    { id: id('number-variable'), code: 'number', name: 'Number' },
    { id: id('form-name-variable'), code: 'form_name', name: 'Form Name' },
  ]).onConflictDoNothing()
  const displayOrder = Math.floor(Math.random() * 1000000) + 1000000
  await db.insert(numberConfigs).values([
    { id: numberConfigId, numberVariableCode: 'number', numberOfDigits: 4, displayOrder },
    { id: formNameConfigId, numberVariableCode: 'form_name', numberOfDigits: 0, displayOrder: displayOrder + 1 },
  ]).onConflictDoNothing()
  const fixture = { db, actorId, verifierId, projectModuleId, systemModuleId, projectRoleId, systemRoleId, businessCategoryId, divisionId, projectId, qualityCategoryId, uomId, rootId, leafOneId, leafTwoId, rootCauseId, inspectorTypeId, pointCode, itpOneId, itpTwoId, itpProductId, itpLeafTwoId, numberConfigId, formNameConfigId, scheduleId, inspectorAssignmentIds: inspectorAssignments.map(({ id: assignmentId }) => assignmentId) }
  fixtures.push(fixture)
  return fixture
}

function manualInput(fixture: Awaited<ReturnType<typeof makeFixture>>, selectedRows?: SelectedWorkItemInput[]) {
  return {
    divisionId: fixture.divisionId,
    projectId: fixture.projectId,
    qualityWorkCategoryId: fixture.qualityCategoryId,
    workItemCategoryId: fixture.rootId,
    targetDate: '2026-08-20',
    locationZone: 'Zone A',
    selectedRows: selectedRows ?? [
      { workItemId: fixture.leafOneId, volume: '2', itpTypeCodes: ['material', 'process', 'product'] },
      { workItemId: fixture.leafTwoId, volume: 3, itpTypeCodes: ['material'] },
    ],
  } as const
}

describe('Quality Inspection workflow', () => {
  it('keeps create and documentation payloads strict', () => {
    expect(selectedWorkItemSchema.safeParse({ workItemId: 'leaf', volume: 0, itpTypeCodes: ['material'] }).success).toBe(false)
    expect(selectedWorkItemSchema.safeParse({ workItemId: 'leaf', volume: 1, itpTypeCodes: ['material', 'material'] }).success).toBe(false)
    expect(createQualityInspectionSchema.safeParse({ scheduleId: 'schedule', targetDate: '2026-08-20', selectedRows: [] }).success).toBe(false)
    expect(submitQualityInspectionDocumentationsSchema.safeParse({ documentations: ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'].map((name) => ({ name, fileAttachment: `uploads/${name}.jpg` })) }).success).toBe(true)
    expect(submitQualityInspectionDocumentationsSchema.safeParse({ documentations: ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'].map((name) => ({ name, fileAttachment: `${name}.jpg` })) }).success).toBe(false)
    const manualPts = qhssePtsEntity.schemas.create.safeParse({ divisionId: 'd1', projectId: 'p1', ptsWorkCategoryId: 'c1', workItemCategoryId: 'w1', workItemId: 'leaf', criteriaCode: 'low', imgBefore: 'uploads/before.jpg', location: 'Site', source: 'qi-report' })
    expect(manualPts.success).toBe(true)
    if (manualPts.success) expect('source' in manualPts.data).toBe(false)
    expect(actionSchemas['complete-qi-report'].safeParse({ criteriaCode: 'low', rootCauseIds: ['cause'], imgBefore: 'uploads/before.jpg', location: 'Site', description: 'QI PTS report' }).success).toBe(true)
    expect(actionSchemas['complete-qi-report'].safeParse({ somUserId: 'user', followUpPlan: 'Plan', targetDate: '2026-08-23', rootCauseIds: ['cause'] }).success).toBe(false)
  })

  it('creates manual and scheduled reports with immutable snapshots and derived schedule values', async () => {
    const fixture = await makeFixture()
    const manual = await createQualityInspection(fixture.actorId, manualInput(fixture))
    expect(manual.stepCode).toBe('report')
    expect(manual.workItems).toHaveLength(2)
    expect(manual.workItems[0]?.workItem).toMatchObject({ name: 'QI Leaf One', uomName: 'm³' })
    expect(manual.workItems[0]?.snapshots.map((snapshot) => snapshot.type)).toEqual(['material', 'process', 'product'])
    expect(manual.workItems[0]?.snapshots[0]).toMatchObject({ criteria: 'C-1', procedureCode: 'P-1', specification: 'S-1', method: 'M-1', frequency: 1, imgDocumentation: 'uploads/itp-material.jpg', description: 'D-1', inspectors: [{ inspectorTypeName: 'Inspector', points: [{ inspectionPointCode: fixture.pointCode, inspectionPointName: 'Inspection Point', value: true }] }] })
    await fixture.db.update(inspectionTestPlans).set({ criteria: 'changed after creation', method: 'changed method', imgDocumentation: 'uploads/changed.jpg', description: 'changed description' }).where(eq(inspectionTestPlans.id, fixture.itpOneId))
    const detail = await getQualityInspection(fixture.actorId, manual.id)
    expect(detail.workItems[0]?.snapshots[0]).toMatchObject({ criteria: 'C-1', method: 'M-1', imgDocumentation: 'uploads/itp-material.jpg', description: 'D-1' })
    const scheduled = await createQualityInspection(fixture.actorId, { scheduleId: fixture.scheduleId, targetDate: '2026-08-22', locationZone: 'Zone B', selectedRows: [{ workItemId: fixture.leafTwoId, volume: 1, itpTypeCodes: ['material'] }] })
    expect(scheduled.divisionId).toBe(fixture.divisionId)
    expect(scheduled.projectId).toBe(fixture.projectId)
    expect(scheduled.qualityWorkCategoryId).toBe(fixture.qualityCategoryId)
    expect(scheduled.workItemCategoryId).toBe(fixture.rootId)
    expect(scheduled.scheduleStartDate).toBe('2026-08-01')
    expect(scheduled.scheduleEndDate).toBe('2026-08-31')
  })

  it('lists legacy summary fields, documentation, month filters, and delete operations', async () => {
    const fixture = await makeFixture()
    const created = await createQualityInspection(fixture.actorId, manualInput(fixture))
    await fixture.db.insert(qualityInspectionDocumentations).values(['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'].map((name) => ({
      qualityInspectionId: created.id,
      name,
      fileAttachment: `uploads/${name.replace(' ', '-')}.jpg`,
      description: `Photo ${name}`,
      createdByUserId: fixture.actorId,
      updatedByUserId: fixture.actorId,
    })))

    const month = created.createdAt.slice(0, 7)
    const included = await listQualityInspections(fixture.actorId, { page: 1, limit: 20, startMonth: month, endMonth: month, search: 'QI Test User' })
    expect(included.total).toBe(1)
    expect(included.data[0]).toMatchObject({
      id: created.id,
      projectName: 'QI Project',
      divisionName: 'QI Division',
      createdByName: 'QI Test User',
      createdByPhoto: null,
      workItemCategoryName: 'QI Root',
      locationZone: 'Zone A',
      allowedOperations: expect.arrayContaining(['detail', 'update', 'delete']),
    })
    expect(included.data[0]?.documentations).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'sudut 1', fileAttachment: 'uploads/sudut-1.jpg', description: 'Photo sudut 1' }),
      expect.objectContaining({ name: 'sudut 4', fileAttachment: 'uploads/sudut-4.jpg', description: 'Photo sudut 4' }),
    ]))
    expect(qualityInspectionListQuerySchema.safeParse({ page: '1', limit: '20', startMonth: month, endMonth: month }).success).toBe(true)

    const nextMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 7)
    await expect(listQualityInspections(fixture.actorId, { page: 1, limit: 20, startMonth: nextMonth })).resolves.toMatchObject({ data: [], total: 0 })
  })

  it('authorizes the requested context operation and hides create-only schedules', async () => {
    const fixture = await makeFixture()
    const context = await loadQualityInspectionCreateContext(fixture.actorId, fixture.projectId, 'create')
    expect(context.tree[0]).toMatchObject({ id: fixture.rootId, categoryName: 'QI Category', volume: '10.00', uomName: 'm³', isHighRisk: true })
    expect(context.tree[0]?.children[0]).toMatchObject({ id: fixture.leafOneId, volume: '2.00', uomName: 'm³', isHighRisk: false })
    await expect(createQualityInspection(fixture.actorId, { ...manualInput(fixture), workItemCategoryId: fixture.leafOneId })).rejects.toThrow()
    await expect(loadQualityInspectionCreateContext(fixture.actorId, fixture.projectId, 'update')).resolves.toMatchObject({ projects: [{ id: fixture.projectId }] })
    const createPermission = (await fixture.db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, 'create-quality-inspection')).limit(1))[0]
    expect(createPermission).toBeTruthy()
    await fixture.db.delete(rolePermissions).where(and(eq(rolePermissions.roleId, fixture.projectRoleId), eq(rolePermissions.permissionId, createPermission!.id)))
    await expect(loadQualityInspectionCreateContext(fixture.actorId, fixture.projectId, 'create')).rejects.toThrow()
    await expect(createQualityInspection(fixture.actorId, manualInput(fixture))).rejects.toThrow()
    await expect(scheduleCreateContext(fixture.actorId, fixture.scheduleId)).rejects.toThrow()
    await expect(listQualityInspectionSchedules(fixture.actorId)).resolves.toEqual([])
  })

  it('runs item, documentation, repair, and final verification with PTS reuse', async () => {
    const fixture = await makeFixture()
    const created = await createQualityInspection(fixture.actorId, manualInput(fixture))
    expect(created.allowedActions).toEqual(['complete-report'])
    expect(created.workItems.every((item) => item.allowedActions.length === 0)).toBe(true)
    await expect(updateQualityInspection(fixture.actorId, created.id, { targetDate: '2026-08-21' })).resolves.toMatchObject({ targetDate: '2026-08-21' })
    await expect(completeReportQualityInspection(fixture.actorId, created.id, { inspectionPointCode: 'unknown-point', workMethod: 'Inspection procedure' })).rejects.toThrow('Inspection Point must be active.')
    const completed = await completeReportQualityInspection(fixture.actorId, created.id, { inspectionPointCode: fixture.pointCode, workMethod: 'Inspection procedure' })
    expect(completed.allowedActions).toEqual(['verify-work-item'])
    expect(completed.workItems.every((item) => item.allowedActions.includes('verify-work-item'))).toBe(true)
    const firstRow = completed.workItems[0]!.row.id
    const secondRow = completed.workItems[1]!.row.id
    const rejected = await verifyQualityInspectionWorkItemItp(fixture.actorId, created.id, firstRow, { resultCode: 'rejected', description: 'Needs correction' })
    expect(rejected.stepCode).toBe('complete-report')
    expect(rejected.allowedActions).toEqual(['verify-work-item'])
    expect(rejected.workItems.find((item) => item.row.id === firstRow)?.allowedActions).toEqual([])
    expect(rejected.workItems.find((item) => item.row.id === secondRow)?.allowedActions).toEqual(['verify-work-item'])
    expect(rejected.activity.every((event) => event.actorName === 'QI Test User')).toBe(true)
    expect(rejected.ptsRejections).toHaveLength(1)
    expect(rejected.ptsRejections[0]?.rejectingUserName).toBe('QI Test User')
    const linkedPts = rejected.workItems.find((item) => item.row.id === firstRow)?.pts
    expect(linkedPts).toMatchObject({ number: expect.stringContaining('PTS'), statusCode: 'open', stepCode: 'qi-report' })
    expect(rejected.ptsRejections[0]).toMatchObject({ qualityInspectionWorkItemItpId: firstRow, qhssePtsId: linkedPts?.id, note: 'Needs correction' })
    expect(rejected.ptsRejections[0]?.rejectedAt).toBeTruthy()
    const ptsId = linkedPts?.id
    expect(ptsId).toBeTruthy()
    const ptsCompleted = await performAction(fixture.actorId, ptsId!, 'complete-qi-report', { criteriaCode: 'high', rootCauseIds: [fixture.rootCauseId], imgBefore: 'uploads/pts-before.jpg', location: 'Zone A', description: 'Corrective PTS report' })
    expect(ptsCompleted.stepCode).toBe('report')
    expect(ptsCompleted.statusCode).toBe('on-progress')
    expect(ptsCompleted.number).toContain('PTS')
    expect(ptsCompleted.criteriaCode).toBe('high')
    expect(ptsCompleted.imgBefore).toBe('uploads/pts-before.jpg')
    expect(ptsCompleted.location).toBe('Zone A')
    expect(ptsCompleted.description).toBe('Corrective PTS report')
    expect(ptsCompleted.somUserId).toBeNull()
    expect(ptsCompleted.followUpPlan).toBeNull()
    expect(ptsCompleted.targetDate).toBeNull()
    expect((await fixture.db.select().from(qhssePtsRootCauses).where(eq(qhssePtsRootCauses.qhssePtsId, ptsId!))).length).toBe(1)
    expect(await fixture.db.select().from(notifications).where(eq(notifications.referenceId, ptsId!))).toHaveLength(0)
    const inspected = await verifyQualityInspectionWorkItemItp(fixture.actorId, created.id, secondRow, { resultCode: 'approved' })
    expect(inspected.stepCode).toBe('inspected')
    expect(inspected.allowedActions).toEqual(['documentation'])
    expect(inspected.documentations.map((documentation) => documentation.name)).toEqual(['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'])
    const docs = ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'].map((name) => ({ name, fileAttachment: `uploads/${name.replace(' ', '-')}.jpg`, description: `Photo ${name}` }))
    const submitted = await submitQualityInspectionDocumentations(fixture.actorId, created.id, { documentations: docs })
    expect(submitted.stepCode).toBe('submitted')
    expect(submitted.allowedActions).toEqual(['verify'])
    const pending = await verifyQualityInspection(fixture.verifierId, created.id, { resultCode: 'pending', description: 'Pending review' })
    expect(pending.stepCode).toBe('submitted')
    expect(pending.allowedActions).toEqual(['verify'])
    expect(pending.verifications).toHaveLength(1)
    expect(pending.verifications[0]).toMatchObject({ resultCode: 'pending', verifierName: 'QI Second Verifier', description: 'Pending review' })
    const itemEventsBeforeRepair = pending.workItems.find((item) => item.row.id === firstRow)?.verifications.length
    const ptsEventsBeforeRepair = pending.ptsRejections.length
    const repaired = await verifyQualityInspection(fixture.actorId, created.id, { resultCode: 'repair', description: 'Repair required' })
    expect(repaired.stepCode).toBe('complete-report')
    expect(repaired.allowedActions).toEqual(['verify-work-item'])
    expect(repaired.workItems.every((item) => item.row.statusCode === 'waiting')).toBe(true)
    expect(repaired.workItems.find((item) => item.row.id === firstRow)?.verifications).toHaveLength(itemEventsBeforeRepair!)
    expect(repaired.ptsRejections).toHaveLength(ptsEventsBeforeRepair)
    expect(repaired.verifications.map((event) => event.verifierName)).toEqual(['QI Second Verifier', 'QI Test User'])
    const rejectedAgain = await verifyQualityInspectionWorkItemItp(fixture.verifierId, created.id, firstRow, { resultCode: 'rejected', description: 'Still open' })
    const firstItemHistory = rejectedAgain.workItems.find((item) => item.row.id === firstRow)?.verifications ?? []
    expect(firstItemHistory).toHaveLength(2)
    expect(firstItemHistory.map((event) => event.verifierName)).toEqual(['QI Test User', 'QI Second Verifier'])
    expect(firstItemHistory.map((event) => event.description)).toEqual(['Needs correction', 'Still open'])
    expect(firstItemHistory.every((event) => event.verifiedAt)).toBe(true)
    expect(firstItemHistory[0]!.verifiedAt <= firstItemHistory[1]!.verifiedAt).toBe(true)
    expect(rejectedAgain.workItems.find((item) => item.row.id === firstRow)?.pts?.id).toBe(ptsId)
    expect(rejectedAgain.ptsRejections).toHaveLength(2)
    expect(rejectedAgain.ptsRejections.map((event) => event.qhssePtsId)).toEqual([ptsId, ptsId])
    expect(rejectedAgain.ptsRejections.map((event) => event.note)).toEqual(['Needs correction', 'Still open'])
    expect(rejectedAgain.ptsRejections.map((event) => event.rejectingUserName)).toEqual(['QI Test User', 'QI Second Verifier'])
    await verifyQualityInspectionWorkItemItp(fixture.actorId, created.id, secondRow, { resultCode: 'approved' })
    const retainedDocs = docs.map((documentation) => ({ ...documentation, description: `Updated ${documentation.description}` }))
    const resubmitted = await submitQualityInspectionDocumentations(fixture.actorId, created.id, { documentations: retainedDocs })
    expect(resubmitted.documentations.find((documentation) => documentation.name === 'sudut 1')).toMatchObject({ fileAttachment: 'uploads/sudut-1.jpg', description: 'Updated Photo sudut 1' })
    expect(resubmitted.allowedActions).toEqual(['verify'])
    const closed = await verifyQualityInspection(fixture.verifierId, created.id, { resultCode: 'approved' })
    expect(closed.statusCode).toBe('close')
    expect(closed.stepCode).toBe('close')
    expect(closed.allowedActions).toEqual([])
    expect(closed).toMatchObject({
      project: { name: 'QI Project' },
      division: { name: 'QI Division' },
      qualityWorkCategory: { name: 'QI Category' },
      workItemCategory: { name: 'QI Root' },
      createdByUser: { name: 'QI Test User' },
    })
    expect(closed.workItems.find((item) => item.row.id === firstRow)).toMatchObject({
      row: { volume: '2.00', statusCode: 'rejected' },
      workItem: { name: 'QI Leaf One', uomName: 'm³' },
      snapshots: expect.arrayContaining([
        expect.objectContaining({ type: 'material', criteria: 'C-1', procedureCode: 'P-1', specification: 'S-1', method: 'M-1', frequency: 1, imgDocumentation: 'uploads/itp-material.jpg', description: 'D-1' }),
      ]),
      verifications: expect.arrayContaining([
        expect.objectContaining({ verifierName: 'QI Test User', verifiedAt: expect.any(String) }),
      ]),
    })
    expect(closed.documentations).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'sudut 1', fileAttachment: 'uploads/sudut-1.jpg', description: 'Updated Photo sudut 1' }),
      expect.objectContaining({ name: 'sudut 4', fileAttachment: 'uploads/sudut-4.jpg', description: 'Updated Photo sudut 4' }),
    ]))
    await expect(updateQualityInspection(fixture.actorId, created.id, { targetDate: '2026-08-24' })).rejects.toThrow()
    expect((await fixture.db.select().from(qualityInspectionVerifications).where(eq(qualityInspectionVerifications.qualityInspectionId, created.id))).map((event) => event.resultCode)).toEqual(['pending', 'repair', 'approved'])
    expect(closed.verifications.map((event) => event.verifierName)).toEqual(['QI Second Verifier', 'QI Test User', 'QI Second Verifier'])
    expect(closed.activity.some((event) => event.actorName === 'QI Second Verifier')).toBe(true)
    expect(await fixture.db.select().from(qualityInspectionDocumentations).where(eq(qualityInspectionDocumentations.qualityInspectionId, created.id))).toHaveLength(4)
    expect((await fixture.db.select().from(notifications).where(eq(notifications.referenceId, created.id))).length).toBe(0)

    const reportRejected = await createQualityInspection(fixture.actorId, manualInput(fixture))
    const reportRejectedCompleted = await completeReportQualityInspection(fixture.actorId, reportRejected.id, { inspectionPointCode: fixture.pointCode, workMethod: 'Inspection procedure' })
    for (const item of reportRejectedCompleted.workItems) await verifyQualityInspectionWorkItemItp(fixture.actorId, reportRejected.id, item.row.id, { resultCode: 'approved' })
    const reportRejectedInspected = await getQualityInspection(fixture.actorId, reportRejected.id)
    expect(reportRejectedInspected.stepCode).toBe('inspected')
    const reportRejectedSubmitted = await submitQualityInspectionDocumentations(fixture.actorId, reportRejected.id, { documentations: docs })
    expect(reportRejectedSubmitted.stepCode).toBe('submitted')
    const reportRejectedClosed = await verifyQualityInspection(fixture.actorId, reportRejected.id, { resultCode: 'rejected', description: 'Rejected report' })
    expect(reportRejectedClosed.statusCode).toBe('close')
    expect(reportRejectedClosed.stepCode).toBe('close')
    expect(reportRejectedClosed.resultCode).toBe('rejected')
  }, 30_000)
})

async function cleanupFixture(fixture: Fixture) {
  const { db } = fixture
  await db.delete(qualityInspections).where(eq(qualityInspections.createdByUserId, fixture.actorId))
  await db.delete(qhssePts).where(eq(qhssePts.createdBy, fixture.actorId))
  await db.delete(workItemSchedules).where(eq(workItemSchedules.id, fixture.scheduleId))
  await db.delete(inspectionTestPlanInspectorPoints).where(inArray(inspectionTestPlanInspectorPoints.inspectionTestPlanInspectorTypeId, fixture.inspectorAssignmentIds))
  await db.delete(inspectionTestPlanInspectorTypes).where(inArray(inspectionTestPlanInspectorTypes.id, fixture.inspectorAssignmentIds))
  await db.delete(inspectionTestPlans).where(inArray(inspectionTestPlans.id, [fixture.itpOneId, fixture.itpTwoId, fixture.itpProductId, fixture.itpLeafTwoId]))
  await db.delete(itpInspectionPoints).where(eq(itpInspectionPoints.code, fixture.pointCode))
  await db.delete(itpInspectorTypes).where(eq(itpInspectorTypes.id, fixture.inspectorTypeId))
  await db.delete(workItems).where(inArray(workItems.id, [fixture.leafOneId, fixture.leafTwoId, fixture.rootId]))
  await db.delete(uoms).where(eq(uoms.id, fixture.uomId))
  await db.delete(projectRoleAssignments).where(inArray(projectRoleAssignments.userId, [fixture.actorId, fixture.verifierId]))
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, fixture.projectRoleId))
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, fixture.systemRoleId))
  await db.delete(systemRoleAssignments).where(inArray(systemRoleAssignments.userId, [fixture.actorId, fixture.verifierId]))
  await db.delete(rootCauses).where(eq(rootCauses.id, fixture.rootCauseId))
  await db.delete(numberConfigs).where(inArray(numberConfigs.id, [fixture.numberConfigId, fixture.formNameConfigId]))
  await db.delete(activityLogs).where(eq(activityLogs.projectId, fixture.projectId))
  await db.delete(notifications).where(eq(notifications.projectId, fixture.projectId))
  await db.delete(users).where(inArray(users.id, [fixture.actorId, fixture.verifierId]))
  await db.delete(projects).where(eq(projects.id, fixture.projectId))
  await db.delete(ptsWorkCategories).where(eq(ptsWorkCategories.id, fixture.qualityCategoryId))
  await db.delete(divisions).where(eq(divisions.id, fixture.divisionId))
  await db.delete(businessCategories).where(eq(businessCategories.id, fixture.businessCategoryId))
  await db.delete(permissions).where(inArray(permissions.moduleId, [fixture.projectModuleId, fixture.systemModuleId]))
  await db.delete(roles).where(inArray(roles.id, [fixture.projectRoleId, fixture.systemRoleId]))
  await db.delete(authorizationModules).where(inArray(authorizationModules.id, [fixture.projectModuleId, fixture.systemModuleId]))
}

afterEach(async () => {
  while (fixtures.length) {
    const fixture = fixtures[fixtures.length - 1]!
    await cleanupFixture(fixture)
    fixtures.pop()
  }
})

afterAll(() => closeDb())
