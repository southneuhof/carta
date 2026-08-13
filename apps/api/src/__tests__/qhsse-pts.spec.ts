import { afterAll, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { app } from '../app'
import { closeDb, getDb } from '../db'
import { getAuth } from '../routes/auth/auth'
import { accounts } from '../routes/auth/auth.entity'
import { businessCategories } from '../routes/business-categories/business-categories.entity'
import { divisions } from '../routes/divisions/divisions.entity'
import { numberConfigs } from '../routes/number-configs/number-configs.entity'
import { numberVariables } from '../routes/number-variables/number-variables.entity'
import { projects } from '../routes/projects/projects.entity'
import { projectVendors } from '../routes/project-vendors/project-vendors.entity'
import { ptsWorkCategories } from '../routes/pts-work-categories/pts-work-categories.entity'
import { rootCauses } from '../routes/root-causes/root-causes.entity'
import { workItems } from '../routes/work-items/work-items.entity'
import { activityLogs, notifications } from '../routes/notifications/notifications.entity'
import { authorizationModules, permissions, projectRoleAssignments, rolePermissions, roles, systemRoleAssignments } from '../routes/roles/roles.entity'
import { users } from '../routes/users/users.entity'
import { createReport, listReports, performAction } from '../routes/qhsse-pts/qhsse-pts.service'
import { actionSchemas } from '../routes/qhsse-pts/qhsse-pts.schemas'

function id(name: string) {
  return `qhsse-test-${name}-${crypto.randomUUID()}`
}

async function makeFixture() {
  const db = getDb()
  const userId = id('user')
  const recipientId = id('recipient')
  const divisionRecipientId = id('division-recipient')
  const allProjectsRecipientId = id('all-projects-recipient')
  const unrelatedRecipientId = id('unrelated-recipient')
  const moduleId = id('module')
  const roleId = id('role')
  const divisionId = id('division')
  const businessCategoryId = id('business-category')
  const projectId = id('project')
  const otherDivisionId = id('other-division')
  const otherProjectId = id('other-project')
  const categoryId = id('category')
  const leafId = id('leaf')
  const ptsCategoryId = id('pts-category')
  const rootCauseId = id('root-cause')
  const vendorId = id('vendor')
  const permissionCodes = [
    'create-qhsse-pts', 'update-qhsse-pts', 'delete-qhsse-pts',
    'low-disposition-qhsse-pts', 'high-disposition-qhsse-pts', 'temporary-plan-qhsse-pts', 'management-notes-qhsse-pts',
    'complete-report-qhsse-pts', 'follow-up-implementation-qhsse-pts', 'follow-up-price-qhsse-pts',
    'implementation-report-qhsse-pts', 'verify-implementation-qhsse-pts', 'realization-qhsse-pts', 'close-qhsse-pts',
  ]
  const systemCodes = ['list-qhsse-pts', 'detail-qhsse-pts']
  const permissionRows = permissionCodes.map((permissionCode) => ({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId }))
  await db.insert(users).values([
    { id: userId, name: 'PTS Test User', email: `${userId}@example.invalid` },
    { id: recipientId, name: 'PTS Recipient', email: `${recipientId}@example.invalid` },
    { id: divisionRecipientId, name: 'PTS Division Recipient', email: `${divisionRecipientId}@example.invalid` },
    { id: allProjectsRecipientId, name: 'PTS All Projects Recipient', email: `${allProjectsRecipientId}@example.invalid` },
    { id: unrelatedRecipientId, name: 'PTS Unrelated Recipient', email: `${unrelatedRecipientId}@example.invalid` },
  ])
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  const systemModuleId = id('system-module')
  const systemRoleId = id('system-role')
  await db.insert(authorizationModules).values([
    { id: moduleId, code: id('module-code'), name: 'QHSSE PTS', realm: 'project' },
    { id: systemModuleId, code: id('system-module-code'), name: 'QHSSE PTS Reads', realm: 'system' },
  ])
  await db.insert(roles).values([
    { id: roleId, roleCode: id('role-code'), name: 'PTS Test Role', realm: 'project' },
    { id: systemRoleId, roleCode: id('system-role-code'), name: 'PTS Read Role', realm: 'system' },
  ])
  await db.insert(permissions).values([
    ...permissionRows,
    ...systemCodes.map((permissionCode) => ({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId: systemModuleId })),
  ]).onConflictDoNothing()
  const availablePermissions = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.permissionCode, permissionCodes))
  const systemPermissions = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.permissionCode, systemCodes))
  await db.insert(rolePermissions).values(availablePermissions.map(({ id: permissionId }) => ({ roleId, permissionId })))
  await db.insert(rolePermissions).values(systemPermissions.map(({ id: permissionId }) => ({ roleId: systemRoleId, permissionId })))
  await db.insert(systemRoleAssignments).values({ userId, roleId: systemRoleId })
  await db.insert(businessCategories).values({ id: businessCategoryId, code: id('business-category-code'), name: 'PTS Business' })
  await db.insert(divisions).values([
    { id: divisionId, businessCategoryId, code: id('division-code'), name: 'PTS Division' },
    { id: otherDivisionId, businessCategoryId, code: id('other-division-code'), name: 'Other PTS Division' },
  ])
  await db.insert(projects).values([
    { id: projectId, divisionId, number: id('project-number'), integrationCode: id('integration'), name: 'PTS Project' },
    { id: otherProjectId, divisionId: otherDivisionId, number: id('other-project-number'), integrationCode: id('other-integration'), name: 'Other PTS Project' },
  ])
  await db.insert(projectRoleAssignments).values([
    { id: id('assignment-user'), projectId, userId, roleId, coverageType: 'project' },
    { id: id('assignment-recipient'), projectId, userId: recipientId, roleId, coverageType: 'project' },
    { id: id('assignment-division-recipient'), userId: divisionRecipientId, roleId, coverageType: 'division', divisionId, projectId: null },
    { id: id('assignment-all-projects-recipient'), userId: allProjectsRecipientId, roleId, coverageType: 'all_projects', divisionId: null, projectId: null },
    { id: id('assignment-unrelated-recipient'), userId: unrelatedRecipientId, roleId, coverageType: 'project', divisionId: null, projectId: otherProjectId },
  ])
  await db.insert(ptsWorkCategories).values({ id: ptsCategoryId, code: id('pts-code'), name: 'PTS Category' })
  await db.insert(workItems).values([
    { id: categoryId, projectId, categoryId: ptsCategoryId, code: id('work-category'), name: 'Work Category' },
    { id: leafId, projectId, parentId: categoryId, code: id('work-leaf'), name: 'Work Leaf' },
  ])
  await db.insert(rootCauses).values({ id: rootCauseId, code: id('root-code'), name: 'Root Cause' })
  await db.insert(projectVendors).values({ id: vendorId, projectId, name: 'PTS Vendor' })
  await db.insert(numberVariables).values({ id: id('number-variable'), code: 'number', name: 'Number' }).onConflictDoNothing()
  await db.insert(numberConfigs).values({ id: id('number-config'), numberVariableCode: 'number', numberOfDigits: 4, displayOrder: 900001 }).onConflictDoNothing()
  const signedIn = await getAuth().api.signInEmail({ body: { email: `${userId}@example.invalid`, password: 'test-password' }, returnHeaders: true })
  return {
    db, userId, recipientId, divisionRecipientId, allProjectsRecipientId, unrelatedRecipientId, divisionId, projectId, roleId,
    categoryId, leafId, ptsCategoryId, rootCauseId, vendorId,
    cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '',
  }
}

function reportInput(fixture: Awaited<ReturnType<typeof makeFixture>>, criteriaCode: 'low' | 'medium' | 'high' = 'low') {
  return {
    divisionId: fixture.divisionId,
    projectId: fixture.projectId,
    ptsWorkCategoryId: fixture.ptsCategoryId,
    workItemCategoryId: fixture.categoryId,
    workItemId: fixture.leafId,
    criteriaCode,
    rootCauseIds: [fixture.rootCauseId],
    imgBefore: 'uploads/before.png',
    location: 'Site',
    description: 'Manual report',
  }
}

describe('manual PTS workflow', () => {
  it('requires both implementation proof images', () => {
    expect(actionSchemas['implementation-report'].safeParse({ implementationDate: '2026-08-10' }).success).toBe(false)
  })

  it('rejects invalid work-item relationships and inactive project mappings', async () => {
    const fixture = await makeFixture()
    await expect(createReport(fixture.userId, { ...reportInput(fixture), workItemCategoryId: fixture.leafId, workItemId: fixture.categoryId })).rejects.toThrow()
    await fixture.db.update(projectRoleAssignments).set({ active: false }).where(and(eq(projectRoleAssignments.projectId, fixture.projectId), eq(projectRoleAssignments.userId, fixture.userId)))
    await expect(createReport(fixture.userId, reportInput(fixture))).rejects.toThrow()
  })

  it('allocates numbers, creates audit records, and scopes notifications', async () => {
    const fixture = await makeFixture()
    const first = await createReport(fixture.userId, reportInput(fixture))
    const second = await createReport(fixture.userId, reportInput(fixture))
    expect(first.number).not.toBe(second.number)
    const inbox = await fixture.db.select({ recipientUserId: notifications.recipientUserId }).from(notifications).where(eq(notifications.referenceId, first.id))
    expect(inbox.map(({ recipientUserId }) => recipientUserId)).toEqual(expect.arrayContaining([fixture.recipientId, fixture.divisionRecipientId, fixture.allProjectsRecipientId]))
    expect(inbox.map(({ recipientUserId }) => recipientUserId)).not.toContain(fixture.unrelatedRecipientId)
  })

  it('runs the low path, supports rejection, and soft deletes after close', async () => {
    const fixture = await makeFixture()
    const created = await createReport(fixture.userId, reportInput(fixture))
    await performAction(fixture.userId, created.id, 'disposition', { dispositionStatusCode: 'repair' })
    await performAction(fixture.userId, created.id, 'complete-report', { somUserId: fixture.userId, followUpPlan: 'Follow up', targetDate: '2026-08-11' })
    await performAction(fixture.userId, created.id, 'follow-up-implementation', { implementationUserId: fixture.userId, workMethod: 'Method' })
    await performAction(fixture.userId, created.id, 'follow-up-price', { estimationCost: '10', jobImplementorType: 'vendor', projectVendorId: fixture.vendorId })
    await performAction(fixture.userId, created.id, 'implementation-report', { implementationDate: '2026-08-14', imgProcess: 'uploads/process.png', imgAfter: 'uploads/after.png', implementationDescription: 'Done' })
    await performAction(fixture.userId, created.id, 'verify-implementation', { implementationStatusCode: 'rejected', implementationVerificationDescription: 'Redo' })
    await performAction(fixture.userId, created.id, 'implementation-report', { implementationDate: '2026-08-15', imgProcess: 'uploads/process-2.png', imgAfter: 'uploads/after-2.png', implementationDescription: 'Redone' })
    await performAction(fixture.userId, created.id, 'verify-implementation', { implementationStatusCode: 'approved', implementationVerificationDescription: 'Approved' })
    await performAction(fixture.userId, created.id, 'realization', { actualCost: '11', actualJobImplementorType: 'internal' })
    const closed = await performAction(fixture.userId, created.id, 'close', {})
    expect(closed.statusCode).toBe('close')
    expect(closed.availableActions).toEqual(['delete'])
    expect((closed as { allowedOperations?: string[] }).allowedOperations).not.toContain('update')
    const deleted = await performAction(fixture.userId, created.id, 'delete', { deletedReason: 'Duplicate report' })
    expect(deleted.deletedAt).toBeTruthy()
    const activity = await fixture.db.select().from(activityLogs).where(and(eq(activityLogs.referenceId, created.id), eq(activityLogs.referenceTable, 'qhsse_pts')))
    expect(activity).toHaveLength(12)
    expect((await listReports(fixture.userId, { page: 1, limit: 20 })).data.some((row) => row.id === created.id)).toBe(false)
  }, 30_000)

  it('takes the high path and locks concurrent actions', async () => {
    const fixture = await makeFixture()
    const lowPermission = (await fixture.db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, 'low-disposition-qhsse-pts')))[0]
    if (!lowPermission) throw new Error('Low disposition permission fixture is missing.')
    await fixture.db.update(rolePermissions).set({ active: false }).where(and(eq(rolePermissions.roleId, fixture.roleId), eq(rolePermissions.permissionId, lowPermission.id)))
    const medium = await createReport(fixture.userId, reportInput(fixture, 'medium'))
    expect((await performAction(fixture.userId, medium.id, 'disposition', { dispositionStatusCode: 'repair' })).stepCode).toBe('low-disposition')
    const created = await createReport(fixture.userId, reportInput(fixture, 'high'))
    expect((await performAction(fixture.userId, created.id, 'disposition', { dispositionStatusCode: 'repair' })).stepCode).toBe('high-disposition')
    expect((await performAction(fixture.userId, created.id, 'temporary-plan', { temporaryFollowUpPlan: 'Temporary' })).stepCode).toBe('management-notes')
    expect((await performAction(fixture.userId, created.id, 'management-notes', { managementNotes: 'Management' })).stepCode).toBe('complete-report')
    const results = await Promise.allSettled([
      performAction(fixture.userId, created.id, 'complete-report', { somUserId: fixture.userId, followUpPlan: 'Follow up', targetDate: '2026-08-13' }),
      performAction(fixture.userId, created.id, 'complete-report', { somUserId: fixture.userId, followUpPlan: 'Second', targetDate: '2026-08-13' }),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
  })
})

afterAll(() => closeDb())
