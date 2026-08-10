import { afterAll, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { closeDb, getDb } from '../db'
import { app } from '../app'
import { getAuth } from '../routes/auth/auth'
import { accounts } from '../routes/auth/auth.entity'
import { businessCategories, divisions, numberConfigs, numberVariables, projects, projectVendors, ptsWorkCategories, rootCauses, workItems } from '../routes/master-data/master-data.entity'
import { notifications, activityLogs } from '../routes/notifications/notifications.entity'
import { permissions, projectUsers, roleGroups, rolePermissions, roles } from '../routes/roles/roles.entity'
import { users } from '../routes/users/users.entity'
import { qhssePts, qhssePtsRootCauses } from '../routes/qhsse-pts/qhsse-pts.entity'
import { createReport, performAction } from '../routes/qhsse-pts/qhsse-pts.service'
import { actionSchemas } from '../routes/qhsse-pts/qhsse-pts.schemas'
import { nextStep } from '../routes/qhsse-pts/qhsse-pts.service'

const row = (values: Partial<Parameters<typeof nextStep>[0]> = {}) => ({
  criteriaCode: 'low',
  followUpImplementationDoneAt: null,
  followUpPriceDoneAt: null,
  stepCode: 'follow-up',
  ...values,
})

describe('manual PTS workflow', () => {
  it.each([
    ['low', 'analysis'],
    ['medium', 'analysis'],
    ['high', 'temporary-plan'],
  ])('routes %s disposition to %s', (criteriaCode, expected) => {
    expect(nextStep(row({ criteriaCode }), 'disposition', {})).toBe(expected)
  })

  it('moves to implementation after either final follow-up', () => {
    expect(nextStep(row({ followUpPriceDoneAt: 'done' }), 'follow-up-implementation', {})).toBe('implementation')
    expect(nextStep(row({ followUpImplementationDoneAt: 'done' }), 'follow-up-price', {})).toBe('implementation')
  })

  it('requires both implementation proof images', () => {
    expect(
      actionSchemas['implementation-report'].safeParse({
        implementationReport: 'Done',
        implementationDate: '2026-08-10',
        cost: '10',
      }).success
    ).toBe(false)
  })
})

function id(name: string) {
  return `qhsse-test-${name}-${crypto.randomUUID()}`
}

async function makeFixture() {
  const db = getDb()
  const userId = id('user')
  const recipientId = id('recipient')
  const groupId = id('group')
  const roleId = id('role')
  const divisionId = id('division')
  const businessCategoryId = id('business-category')
  const projectId = id('project')
  const categoryId = id('category')
  const leafId = id('leaf')
  const ptsCategoryId = id('pts-category')
  const rootCauseId = id('root-cause')
  const vendorId = id('vendor')
  const permissionCodes = [
    'view-qhsse-pts',
    'show-qhsse-pts',
    'create-qhsse-pts',
    'update-qhsse-pts',
    'delete-qhsse-pts',
    'disposition-qhsse-pts',
    'temporary-plan-qhsse-pts',
    'management-notes-qhsse-pts',
    'complete-report-qhsse-pts',
    'follow-up-implementation-qhsse-pts',
    'follow-up-price-qhsse-pts',
    'implementation-report-qhsse-pts',
    'verify-implementation-qhsse-pts',
    'realization-qhsse-pts',
    'close-qhsse-pts',
  ]
  const permissionRows = permissionCodes.map((permissionCode) => ({
    id: id(permissionCode),
    permissionCode,
    name: permissionCode,
    permissionGroup: 'qhsse-pts',
  }))
  await db.insert(users).values([
    { id: userId, name: 'PTS Test User', email: `${userId}@example.invalid` },
    { id: recipientId, name: 'PTS Recipient', email: `${recipientId}@example.invalid` },
  ])
  await db.insert(accounts).values({
    id: id('account'),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: await hashPassword('test-password'),
  })
  await db.insert(roleGroups).values({ id: groupId, roleGroupCode: id('group-code'), name: 'PTS Test Group' })
  await db.insert(roles).values({
    id: roleId,
    roleCode: id('role-code'),
    name: 'PTS Test Role',
    roleGroupId: groupId,
    assignmentScope: 'project',
  })
  await db.insert(permissions).values(permissionRows).onConflictDoNothing()
  const availablePermissions = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.permissionCode, permissionCodes))
  await db.insert(rolePermissions).values(availablePermissions.map(({ id: permissionId }) => ({ roleId, permissionId })))
  await db.insert(businessCategories).values({ id: businessCategoryId, code: id('business-category-code'), name: 'PTS Business' })
  await db.insert(divisions).values({ id: divisionId, businessCategoryId, code: id('division-code'), name: 'PTS Division' })
  await db.insert(projects).values({ id: projectId, divisionId, number: id('project-number'), integrationCode: id('integration'), name: 'PTS Project' })
  await db.insert(projectUsers).values([
    { projectId, userId, roleId },
    { projectId, userId: recipientId, roleId },
  ])
  await db.insert(workItems).values([
    { id: categoryId, projectId, code: id('work-category'), name: 'Work Category' },
    { id: leafId, projectId, parentId: categoryId, code: id('work-leaf'), name: 'Work Leaf' },
  ])
  await db.insert(ptsWorkCategories).values({ id: ptsCategoryId, code: id('pts-code'), name: 'PTS Category' })
  await db.insert(rootCauses).values({ id: rootCauseId, code: id('root-code'), name: 'Root Cause' })
  await db.insert(projectVendors).values({ id: vendorId, projectId, name: 'PTS Vendor' })
  await db
    .insert(numberVariables)
    .values({ id: id('number-variable'), code: 'number', name: 'Number' })
    .onConflictDoNothing()
  await db
    .insert(numberConfigs)
    .values({ id: id('number-config'), numberVariableCode: 'number', numberOfDigits: 4, displayOrder: 900001 })
    .onConflictDoNothing()
  const signedIn = await getAuth().api.signInEmail({
    body: { email: `${userId}@example.invalid`, password: 'test-password' },
    returnHeaders: true,
  })
  return {
    db,
    userId,
    recipientId,
    divisionId,
    projectId,
    categoryId,
    leafId,
    ptsCategoryId,
    rootCauseId,
    vendorId,
    cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '',
  }
}

function reportInput(fixture: Awaited<ReturnType<typeof makeFixture>>, criteriaCode: 'low' | 'medium' | 'high' = 'low') {
  return {
    date: '2026-08-10',
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

describe('manual PTS database boundaries', () => {
  it('rejects invalid work-item relationships and inactive project mappings', async () => {
    const fixture = await makeFixture()
    await expect(
      createReport(fixture.userId, {
        ...reportInput(fixture),
        workItemCategoryId: fixture.leafId,
        workItemId: fixture.categoryId,
      })
    ).rejects.toThrow()
    await fixture.db
      .update(projectUsers)
      .set({ active: false })
      .where(and(eq(projectUsers.projectId, fixture.projectId), eq(projectUsers.userId, fixture.userId)))
    await expect(createReport(fixture.userId, reportInput(fixture))).rejects.toThrow()
  })

  it('allocates unique numbers and limits project reads', async () => {
    const fixture = await makeFixture()
    const first = await createReport(fixture.userId, reportInput(fixture))
    const second = await createReport(fixture.userId, reportInput(fixture))
    expect(first.number).not.toBe(second.number)

    const lookup = await app.request('/qhsse-pts/lookups', {
      headers: { Cookie: fixture.cookie },
    })
    expect(lookup.status).toBe(200)
    expect((await lookup.json()).data.projects).toHaveLength(1)

    const otherProjectId = id('other-project')
    await fixture.db.insert(projects).values({
      id: otherProjectId,
      divisionId: fixture.divisionId,
      number: id('other-number'),
      integrationCode: id('other-integration'),
      name: 'Other Project',
    })
    const other = await fixture.db
      .insert(qhssePts)
      .values({
        date: '2026-08-10',
        divisionId: fixture.divisionId,
        projectId: otherProjectId,
        number: id('other-pts'),
        ptsWorkCategoryId: fixture.ptsCategoryId,
        workItemCategoryId: fixture.categoryId,
        workItemId: fixture.leafId,
        criteriaCode: 'low',
        imgBefore: 'uploads/before.png',
        location: 'Other site',
        description: 'Other project report',
        createdBy: fixture.userId,
        updatedBy: fixture.userId,
      })
      .returning({ id: qhssePts.id })
    const response = await app.request(`/qhsse-pts/detail/${other[0]!.id}`, {
      headers: { Cookie: fixture.cookie },
    })
    expect(response.status).toBe(403)
  })

  it('runs the low path, reject loop, activity, and recipient notification', async () => {
    const fixture = await makeFixture()
    const created = await createReport(fixture.userId, reportInput(fixture))
    await expect(performAction(fixture.userId, created.id, 'close', { closeNotes: 'No', closeDate: '2026-08-10' })).rejects.toThrow()
    await performAction(fixture.userId, created.id, 'disposition', { dispositionStatusCode: 'low', notes: 'Accepted' })
    await performAction(fixture.userId, created.id, 'complete-analysis', { analysis: 'Analysed', targetDate: '2026-08-11' })
    const followUpInbox = await fixture.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.referenceId, created.id), eq(notifications.recipientUserId, fixture.recipientId)))
    expect(followUpInbox.filter(({ title }) => title.includes('follow-up'))).toHaveLength(2)
    await performAction(fixture.userId, created.id, 'follow-up-implementation', { implementationPlan: 'Implement', targetDate: '2026-08-12' })
    await performAction(fixture.userId, created.id, 'follow-up-price', { priceFollowUp: 'Priced', targetDate: '2026-08-13', cost: '10' })
    await performAction(fixture.userId, created.id, 'implementation-report', {
      implementationReport: 'Done',
      implementationDate: '2026-08-14',
      cost: '10',
      imgProcess: 'uploads/process.png',
      imgAfter: 'uploads/after.png',
    })
    await performAction(fixture.userId, created.id, 'verification', { decision: 'reject', notes: 'Redo' })
    await performAction(fixture.userId, created.id, 'implementation-report', {
      implementationReport: 'Redone',
      implementationDate: '2026-08-15',
      cost: '11',
      imgProcess: 'uploads/process-2.png',
      imgAfter: 'uploads/after-2.png',
    })
    await performAction(fixture.userId, created.id, 'verification', { decision: 'approve', notes: 'Approved' })
    await performAction(fixture.userId, created.id, 'realization', { realization: 'Realized', date: '2026-08-16', actualCost: '11', vendorId: fixture.vendorId })
    const closed = await performAction(fixture.userId, created.id, 'close', { closeNotes: 'Closed', closeDate: '2026-08-17' })
    expect(closed.statusCode).toBe('closed')
    expect(closed.availableActions).toEqual([])
    const activity = await fixture.db
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.referenceId, created.id), eq(activityLogs.referenceTable, 'qhsse_pts')))
    const inbox = await fixture.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.referenceId, created.id), eq(notifications.recipientUserId, fixture.recipientId)))
    expect(activity.length).toBe(11)
    expect(inbox.length).toBeGreaterThan(0)
  })

  it('runs the high path and accepts the reverse follow-up order', async () => {
    const fixture = await makeFixture()
    const created = await createReport(fixture.userId, reportInput(fixture, 'high'))
    expect((await performAction(fixture.userId, created.id, 'disposition', { dispositionStatusCode: 'high', notes: 'High' })).stepCode).toBe('temporary-plan')
    expect((await performAction(fixture.userId, created.id, 'temporary-plan', { temporaryPlan: 'Temporary', targetDate: '2026-08-11' })).stepCode).toBe('management-notes')
    expect((await performAction(fixture.userId, created.id, 'management-notes', { managementNotes: 'Management', targetDate: '2026-08-12' })).stepCode).toBe('analysis')
    await performAction(fixture.userId, created.id, 'complete-analysis', { analysis: 'Analysed', targetDate: '2026-08-13' })
    expect((await performAction(fixture.userId, created.id, 'follow-up-price', { priceFollowUp: 'Priced', targetDate: '2026-08-14', cost: '10' })).stepCode).toBe('follow-up')
    expect((await performAction(fixture.userId, created.id, 'follow-up-implementation', { implementationPlan: 'Implement', targetDate: '2026-08-15' })).stepCode).toBe('implementation')
  })

  it('allows only one concurrent action on the same report', async () => {
    const fixture = await makeFixture()
    const created = await createReport(fixture.userId, reportInput(fixture))
    const results = await Promise.allSettled([
      performAction(fixture.userId, created.id, 'disposition', { dispositionStatusCode: 'low', notes: 'First' }),
      performAction(fixture.userId, created.id, 'disposition', { dispositionStatusCode: 'low', notes: 'Second' }),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
  })
})

afterAll(() => closeDb())
