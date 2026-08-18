import { afterAll, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'
import { app } from '../app'
import { closeDb, getDb } from '../db'
import { accessibleProjectIds, coveredProjectIds } from '../authorization'
import { accounts } from '../routes/auth/auth.entity'
import { getAuth } from '../routes/auth/auth'
import { businessCategories } from '../routes/business-categories/business-categories.entity'
import { divisions } from '../routes/divisions/divisions.entity'
import { authorizationModules, permissions, projectRoleAssignments, rolePermissions, roles, systemRoleAssignments } from '../routes/roles/roles.entity'
import { projects } from '../routes/projects/projects.entity'
import { projectVendors } from '../routes/project-vendors/project-vendors.entity'
import { ptsWorkCategories } from '../routes/pts-work-categories/pts-work-categories.entity'
import { qhssePts } from '../routes/qhsse-pts/qhsse-pts.entity'
import { inspectionTestPlans } from '../routes/inspection-test-plans/inspection-test-plans.entity'
import { uoms } from '../routes/uoms/uoms.entity'
import { users } from '../routes/users/users.entity'
import { workItems } from '../routes/work-items/work-items.entity'

function id(prefix: string) {
  return `project-scope-test-${prefix}-${crypto.randomUUID()}`
}

async function ensurePermissionIds(codes: string[], realm: 'system' | 'project') {
  const db = getDb()
  const moduleId = id(`${realm}-module`)
  await db.insert(authorizationModules).values({ id: moduleId, code: id(`${realm}-module-code`), name: `${realm} test module`, realm }).onConflictDoNothing()
  const permissionIds = new Map<string, string>()
  for (const code of codes) {
    const existing = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, code)).limit(1))[0]
    if (existing) {
      permissionIds.set(code, existing.id)
      continue
    }
    const inserted = await db.insert(permissions).values({ id: id(code), permissionCode: code, name: code, moduleId }).returning({ id: permissions.id })
    if (!inserted[0]) throw new Error(`Permission ${code} was not created.`)
    permissionIds.set(code, inserted[0].id)
  }
  return permissionIds
}

type CoverageCase = 'project' | 'division' | 'all_projects'

async function makeFixture(coverageType: CoverageCase = 'project') {
  const db = getDb()
  const userId = id('user')
  const email = `${userId}@example.invalid`
  const businessCategoryId = id('business-category')
  const divisionAId = id('division-a')
  const divisionBId = id('division-b')
  const projectAId = id('project-a')
  const projectBId = id('project-b')
  const projectCId = id('project-c')
  const projectDId = id('project-d')
  const projectRoleId = id('project-role')
  const emptyRoleId = id('empty-role')
  const systemRoleId = id('system-role')
  const categoryId = id('pts-category')
  const projectCodes = [
    'create-qhsse-pts',
    'update-qhsse-pts',
    'delete-qhsse-pts',
  ]
  const systemCodes = [
    'create-projects',
    'list-projects',
    'detail-projects',
    'update-projects',
    'delete-projects',
    'view-projects',
    'list-work-items',
    'detail-work-items',
    'create-work-items',
    'update-work-items',
    'delete-work-items',
    'list-project-vendors',
    'detail-project-vendors',
    'create-project-vendors',
    'update-project-vendors',
    'delete-project-vendors',
    'list-qhsse-pts',
    'detail-qhsse-pts',
    'list-divisions',
    'detail-divisions',
    'list-users',
    'detail-users',
  ]
  const projectPermissionIds = await ensurePermissionIds(projectCodes, 'project')
  const systemPermissionIds = await ensurePermissionIds(systemCodes, 'system')

  await db.insert(users).values({ id: userId, name: 'Project Scope User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(businessCategories).values({ id: businessCategoryId, code: id('business-code'), name: 'Scope Business' })
  await db.insert(divisions).values([
    { id: divisionAId, businessCategoryId, code: id('division-a-code'), name: 'Division A' },
    { id: divisionBId, businessCategoryId, code: id('division-b-code'), name: 'Division B' },
  ])
  await db.insert(projects).values([
    { id: projectAId, divisionId: divisionAId, number: id('project-a-number'), integrationCode: id('project-a-integration'), name: `${userId} Project A` },
    { id: projectBId, divisionId: divisionAId, number: id('project-b-number'), integrationCode: id('project-b-integration'), name: `${userId} Project B` },
    { id: projectCId, divisionId: divisionBId, number: id('project-c-number'), integrationCode: id('project-c-integration'), name: `${userId} Project C` },
    { id: projectDId, divisionId: divisionAId, number: id('project-d-number'), integrationCode: id('project-d-integration'), name: `${userId} Project D` },
  ])
  await db.insert(roles).values([
    { id: projectRoleId, roleCode: id('project-role-code'), name: 'Scoped Project Role', realm: 'project' },
    { id: emptyRoleId, roleCode: id('empty-role-code'), name: 'Empty Project Role', realm: 'project' },
    { id: systemRoleId, roleCode: id('system-role-code'), name: 'Project Creator Role', realm: 'system' },
  ])
  await db.insert(rolePermissions).values(projectCodes.map((code) => ({ roleId: projectRoleId, permissionId: projectPermissionIds.get(code)! })))
  await db.insert(rolePermissions).values(systemCodes.map((code) => ({ roleId: systemRoleId, permissionId: systemPermissionIds.get(code)! })))
  await db.insert(systemRoleAssignments).values({ userId, roleId: systemRoleId })
  await db.insert(projectRoleAssignments).values({
    id: id('project-assignment-scope'),
    userId,
    roleId: projectRoleId,
    coverageType,
    divisionId: coverageType === 'division' ? divisionAId : null,
    projectId: coverageType === 'project' ? projectAId : null,
  })
  if (coverageType === 'project') {
    await db.insert(projectRoleAssignments).values({ id: id('project-assignment-empty'), userId, roleId: emptyRoleId, coverageType: 'project', projectId: projectBId, divisionId: null })
  }
  await db.insert(ptsWorkCategories).values({ id: categoryId, code: id('pts-category-code'), name: 'Scope Category' })

  const records = await Promise.all([projectAId, projectBId, projectCId].map(async (projectId, index) => {
    const rootId = id(`work-root-${index}`)
    const leafId = id(`work-leaf-${index}`)
    const vendorId = id(`vendor-${index}`)
    const reportId = id(`report-${index}`)
    await db.insert(workItems).values([
      { id: rootId, projectId, code: id(`root-code-${index}`), name: `${userId} Root ${index}`, level: 1 },
      { id: leafId, projectId, parentId: rootId, code: id(`leaf-code-${index}`), name: `${userId} Leaf ${index}`, level: 2 },
    ])
    await db.insert(projectVendors).values({ id: vendorId, projectId, name: `${userId} Vendor ${index}` })
    await db.insert(qhssePts).values({
      id: reportId,
      divisionId: projectId === projectCId ? divisionBId : divisionAId,
      projectId,
      number: id(`report-number-${index}`),
      ptsWorkCategoryId: categoryId,
      workItemCategoryId: rootId,
      workItemId: leafId,
      criteriaCode: 'low',
      imgBefore: 'uploads/before.png',
      location: 'Scope site',
      description: `${userId} Report ${index}`,
      createdBy: userId,
      updatedBy: userId,
    })
    return { rootId, leafId, vendorId, reportId }
  }))
  const uomId = id('uom')
  const itpId = id('itp')
  await db.insert(uoms).values({ id: uomId, code: id('uom-code'), name: 'Scope UOM', uomType: 'work-items', active: true })
  await db.insert(inspectionTestPlans).values({ id: itpId, workItemId: records[0]!.leafId, type: 'material', frequency: 1, active: true })

  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  return {
    db,
    userId,
    projectRoleId,
    systemRoleId,
    categoryId,
    uomId,
    itpId,
    cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '',
    divisionAId,
    projectAId,
    projectBId,
    projectCId,
    projectDId,
    projectCreateDivisionId: divisionAId,
    records,
  }
}

function jsonHeaders(cookie: string) {
  return { Cookie: cookie, 'Content-Type': 'application/json' }
}

const scopeCases = [
  { name: 'exact project', coverageType: 'project', projectIds: ['projectAId', 'projectBId'] as const, projectTotal: 2, recordTotal: 2, inaccessibleProject: 'projectCId' as const },
  { name: 'current division', coverageType: 'division', projectIds: ['projectAId', 'projectBId', 'projectDId'] as const, projectTotal: 3, recordTotal: 2, inaccessibleProject: 'projectCId' as const },
  { name: 'all projects', coverageType: 'all_projects', projectIds: ['projectAId', 'projectBId', 'projectCId', 'projectDId'] as const, projectTotal: 3, recordTotal: 3, inaccessibleProject: undefined },
] as const

describe('project-owned authorization surfaces', () => {
  it('returns 401 without a session', async () => {
    expect((await app.request('/projects/list')).status).toBe(401)
  })

  it.each(scopeCases)('$name coverage scopes every collection', async ({ coverageType, projectIds, projectTotal, recordTotal, inaccessibleProject }) => {
    const fixture = await makeFixture(coverageType)
    const expectedProjectIds = projectIds.map((key) => fixture[key])
    const scopedProjectIds = (await coveredProjectIds(fixture.userId)).map(({ id }) => id)
    const projectListIds = expectedProjectIds.filter((projectId) => projectId !== fixture.projectCId)
    const recordProjectIds = expectedProjectIds.filter((projectId) => projectId !== fixture.projectDId)

    const projectsResponse = await app.request(`/projects/list?limit=100&divisionId=${fixture.divisionAId}`, { headers: { Cookie: fixture.cookie } })
    const projectsData = await projectsResponse.json()
    expect(projectsData.total).toBe(projectTotal)
    expect(projectsData.data.every((row: { id: string }) => projectListIds.includes(row.id))).toBe(true)
    for (const projectId of expectedProjectIds) expect(scopedProjectIds).toContain(projectId)
    expect(new Set(projectsData.data.map((row: { id: string }) => row.id))).toEqual(new Set(projectListIds))
    expect(projectsData.data.every((row: { allowedOperations: string[] }) => row.allowedOperations.join(',') === 'detail,update,delete')).toBe(true)

    const searchPrefix = encodeURIComponent(fixture.userId)
    const vendorsData = await (await app.request(`/project-vendors/list?search=${searchPrefix}`, { headers: { Cookie: fixture.cookie } })).json()
    expect(vendorsData.total).toBe(recordTotal)
    expect(new Set(vendorsData.data.map((row: { projectId: string }) => row.projectId))).toEqual(new Set(recordProjectIds))
    expect(vendorsData.data.every((row: { allowedOperations: string[] }) => row.allowedOperations.join(',') === 'detail,update,delete')).toBe(true)

    const workItemsData = await (await app.request(`/work-items/list?search=${searchPrefix}`, { headers: { Cookie: fixture.cookie } })).json()
    expect(workItemsData.total).toBe(recordTotal * 2)
    expect(new Set(workItemsData.data.map((row: { projectId: string }) => row.projectId))).toEqual(new Set(recordProjectIds))

    const ptsData = await (await app.request(`/qhsse-pts/list?search=${searchPrefix}`, { headers: { Cookie: fixture.cookie } })).json()
    expect(ptsData.total).toBe(recordTotal)
    expect(ptsData.data).toHaveLength(recordTotal)
    expect(new Set(ptsData.data.map((row: { projectId: string }) => row.projectId))).toEqual(new Set(recordProjectIds))

    if (inaccessibleProject) {
      const inaccessibleIndex = inaccessibleProject === 'projectCId' ? 2 : 1
      expect((await (await app.request(`/projects/list?search=${encodeURIComponent(`${fixture.userId} Project ${String.fromCharCode(65 + inaccessibleIndex)}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
      expect((await (await app.request(`/project-vendors/list?search=${encodeURIComponent(`${fixture.userId} Vendor ${inaccessibleIndex}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
      expect((await (await app.request(`/work-items/list?search=${encodeURIComponent(`${fixture.userId} Leaf ${inaccessibleIndex}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
      expect((await (await app.request(`/qhsse-pts/list?search=${encodeURIComponent(`${fixture.userId} Report ${inaccessibleIndex}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
    }
  })

  it.each(scopeCases)('$name coverage is returned by coveredProjectIds', async ({ coverageType, projectIds }) => {
    const fixture = await makeFixture(coverageType)
    const rows = await coveredProjectIds(fixture.userId)
    const actual = new Set(rows.map(({ id }) => id))
    for (const key of projectIds) expect(actual).toContain(fixture[key])
    if (coverageType === 'project') expect(actual).toEqual(new Set([fixture.projectAId, fixture.projectBId]))
    else if (coverageType !== 'all_projects') expect(actual).toEqual(new Set(projectIds.map((key) => fixture[key])))
  })

  it('returns assigned projects from coveredProjectIds without a workflow permission', async () => {
    const fixture = await makeFixture()
    const createPermission = (await fixture.db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, 'create-qhsse-pts')))[0]
    if (!createPermission) throw new Error('create-qhsse-pts fixture is missing.')
    await fixture.db.update(rolePermissions).set({ active: false }).where(eq(rolePermissions.permissionId, createPermission.id))
    expect((await coveredProjectIds(fixture.userId)).map(({ id }) => id)).toEqual(expect.arrayContaining([fixture.projectAId]))
    expect((await accessibleProjectIds(fixture.userId, 'create-qhsse-pts')).map(({ id }) => id)).toEqual([])
  })

  it('protects ITP reads and rejects children below an active ITP', async () => {
    const fixture = await makeFixture()
    const leaf = fixture.records[0]!
    const headers = { Cookie: fixture.cookie }

    expect((await app.request(`/inspection-test-plans/template?projectId=${fixture.projectAId}`, { headers })).status).toBe(200)
    const tree = await app.request(`/inspection-test-plans/project/${fixture.projectAId}/tree`, { headers })
    expect(tree.status).toBe(200)
    expect((await tree.json()).data[0].children[0].itps[0].id).toBe(fixture.itpId)
    expect((await app.request(`/inspection-test-plans/detail/${fixture.itpId}`, { headers })).status).toBe(200)

    expect((await app.request(`/inspection-test-plans/template?projectId=${fixture.projectCId}`, { headers })).status).toBe(404)
    expect((await app.request(`/inspection-test-plans/project/${fixture.projectCId}/tree`, { headers })).status).toBe(404)

    const viewPermission = (await fixture.db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, 'view-projects')).limit(1))[0]
    if (!viewPermission) throw new Error('view-projects fixture is missing.')
    await fixture.db.update(rolePermissions).set({ active: false }).where(and(
      eq(rolePermissions.roleId, fixture.systemRoleId),
      eq(rolePermissions.permissionId, viewPermission.id),
    ))
    expect((await app.request(`/inspection-test-plans/template?projectId=${fixture.projectAId}`, { headers })).status).toBe(403)
    expect((await app.request(`/inspection-test-plans/project/${fixture.projectAId}/tree`, { headers })).status).toBe(403)
    expect((await app.request(`/inspection-test-plans/detail/${fixture.itpId}`, { headers })).status).toBe(403)

    const movableId = id('movable-work-item')
    await fixture.db.insert(workItems).values({
      id: movableId,
      projectId: fixture.projectAId,
      parentId: leaf.rootId,
      code: id('movable-code'),
      name: `${fixture.userId} Movable`,
      level: 2,
      volume: '1',
      uomId: fixture.uomId,
    })

    const blockedCreate = await app.request('/work-items/create', {
      method: 'POST',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ projectId: fixture.projectAId, parentId: leaf.leafId, name: `${fixture.userId} Blocked`, volume: '1', uomId: fixture.uomId }),
    })
    expect(blockedCreate.status).toBe(400)
    expect(JSON.stringify(await blockedCreate.json())).toContain('Work item with an active ITP cannot receive a child.')
    expect(await fixture.db.select({ id: workItems.id }).from(workItems).where(eq(workItems.name, `${fixture.userId} Blocked`))).toHaveLength(0)

    const normalCreate = await app.request('/work-items/create', {
      method: 'POST',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ projectId: fixture.projectAId, parentId: leaf.rootId, name: `${fixture.userId} Normal`, volume: '1', uomId: fixture.uomId }),
    })
    expect(normalCreate.status).toBe(201)
    const normalChild = (await normalCreate.json()).data
    const normalMove = await app.request(`/work-items/update/${movableId}`, {
      method: 'PATCH',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ parentId: normalChild.id }),
    })
    expect(normalMove.status).toBe(200)

    const blockedMove = await app.request(`/work-items/update/${movableId}`, {
      method: 'PATCH',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ parentId: leaf.leafId }),
    })
    expect(blockedMove.status).toBe(400)
    expect(JSON.stringify(await blockedMove.json())).toContain('Work item with an active ITP cannot receive a child.')
    expect((await fixture.db.select({ parentId: workItems.parentId }).from(workItems).where(eq(workItems.id, movableId)).limit(1))[0]?.parentId).toBe(normalChild.id)
    expect((await fixture.db.select({ active: inspectionTestPlans.active }).from(inspectionTestPlans).where(eq(inspectionTestPlans.id, fixture.itpId)).limit(1))[0]?.active).toBe(true)
  })

  it('paginates QHSSE rows and counts only the scoped rows', async () => {
    const fixture = await makeFixture()
    const record = fixture.records[0]!
    await fixture.db.insert(qhssePts).values([1, 2].map((index) => ({
      id: id(`paged-report-${index}`),
      date: '2026-08-11',
      divisionId: fixture.divisionAId,
      projectId: fixture.projectAId,
      number: id(`paged-report-number-${index}`),
      ptsWorkCategoryId: fixture.categoryId,
      workItemCategoryId: record.rootId,
      workItemId: record.leafId,
      criteriaCode: 'low',
      imgBefore: 'uploads/before.png',
      location: 'Paged site',
      description: `Paged report ${index}`,
      createdBy: fixture.userId,
      updatedBy: fixture.userId,
    })))

    const page = await app.request(`/qhsse-pts/list?page=2&limit=1&projectId=${fixture.projectAId}`, { headers: { Cookie: fixture.cookie } })
    expect(page.status).toBe(200)
    const data = await page.json()
    expect(data.page).toBe(2)
    expect(data.limit).toBe(1)
    expect(data.total).toBe(3)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].projectId).toBe(fixture.projectAId)
  })

  it('uses one project scope for lists, details, trees, create options, writes, and operations', async () => {
    const fixture = await makeFixture()
    const a = fixture.records[0]!
    const b = fixture.records[1]!
    const c = fixture.records[2]!

    const projectsResponse = await app.request('/projects/list', { headers: { Cookie: fixture.cookie } })
    expect(projectsResponse.status).toBe(200)
    const projectsData = await projectsResponse.json()
    expect(projectsData.total).toBe(2)
    expect(new Set(projectsData.data.map((row: { id: string }) => row.id))).toEqual(new Set([fixture.projectAId, fixture.projectBId]))
    expect(projectsData.data[0].allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect((await app.request(`/projects/detail/${fixture.projectAId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/projects/detail/${fixture.projectBId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/projects/detail/${fixture.projectCId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const vendorsResponse = await app.request('/project-vendors/list', { headers: { Cookie: fixture.cookie } })
    expect(vendorsResponse.status).toBe(200)
    const vendorsData = await vendorsResponse.json()
    expect(vendorsData.total).toBe(2)
    expect(new Set(vendorsData.data.map((row: { projectId: string }) => row.projectId))).toEqual(new Set([fixture.projectAId, fixture.projectBId]))
    expect(vendorsData.data[0].allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect((await app.request(`/project-vendors/detail/${b.vendorId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/project-vendors/detail/${c.vendorId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const workItemsResponse = await app.request('/work-items/list', { headers: { Cookie: fixture.cookie } })
    expect(workItemsResponse.status).toBe(200)
    const workItemsData = await workItemsResponse.json()
    expect(workItemsData.total).toBe(4)
    expect(new Set(workItemsData.data.map((row: { projectId: string }) => row.projectId))).toEqual(new Set([fixture.projectAId, fixture.projectBId]))
    expect(workItemsData.data.every((row: { allowedOperations: string[] }) => row.allowedOperations.join(',') === 'detail,update,delete')).toBe(true)
    const treeResponse = await app.request(`/work-items/tree/tree?projectId=${fixture.projectAId}`, { headers: { Cookie: fixture.cookie } })
    expect(treeResponse.status).toBe(200)
    expect(await treeResponse.json()).toMatchObject({ data: [{ id: a.rootId, allowedOperations: ['detail', 'update', 'delete'] }] })
    expect((await app.request(`/work-items/detail/${b.leafId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/work-items/detail/${c.leafId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const ptsListResponse = await app.request('/qhsse-pts/list', { headers: { Cookie: fixture.cookie } })
    expect(ptsListResponse.status).toBe(200)
    const ptsList = await ptsListResponse.json()
    expect(ptsList.total).toBe(2)
    expect(new Set(ptsList.data.map((row: { projectId: string }) => row.projectId))).toEqual(new Set([fixture.projectAId, fixture.projectBId]))
    expect(ptsList.data.find((row: { projectId: string }) => row.projectId === fixture.projectAId)?.allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect(ptsList.data.find((row: { projectId: string }) => row.projectId === fixture.projectBId)?.allowedOperations).toEqual(['detail'])
    expect((await app.request(`/qhsse-pts/detail/${b.reportId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/qhsse-pts/detail/${c.reportId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const workMove = await app.request(`/work-items/update/${a.leafId}`, {
      method: 'PATCH',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ projectId: fixture.projectCId }),
    })
    expect(workMove.status).toBe(404)
    const vendorMove = await app.request(`/project-vendors/update/${a.vendorId}`, {
      method: 'PATCH',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ projectId: fixture.projectCId }),
    })
    expect(vendorMove.status).toBe(404)
  })

  it('keeps project creation system-owned and scopes project writes', async () => {
    const fixture = await makeFixture()
    const create = await app.request('/projects/create', {
      method: 'POST',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({
        divisionId: fixture.projectCreateDivisionId,
        number: id('created-number'),
        integrationCode: id('created-integration'),
        name: 'Created Project',
        startDate: '2026-08-11',
      }),
    })
    expect(create.status).toBe(201)
    const created = (await create.json()).data
    expect(created.allowedOperations).toEqual([])
    expect(await fixture.db.select().from(projectRoleAssignments).where(eq(projectRoleAssignments.projectId, created.id))).toHaveLength(0)

    const update = await app.request(`/projects/update/${fixture.projectAId}`, {
      method: 'PATCH',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ name: 'Updated Project A' }),
    })
    expect(update.status).toBe(200)
    expect((await update.json()).data.allowedOperations).toEqual(['detail', 'update', 'delete'])

    await fixture.db.insert(projectRoleAssignments).values({ id: id('project-assignment-d'), userId: fixture.userId, roleId: fixture.projectRoleId, coverageType: 'project', projectId: fixture.projectDId, divisionId: null })
    const deleted = await app.request(`/projects/delete/${fixture.projectDId}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(deleted.status).toBe(200)
  })

  it('gates owner lists with list verbs and approved filters', async () => {
    const fixture = await makeFixture()
    const emptyDivisionId = id('empty-division')
    const businessCategoryId = (await fixture.db.select({ businessCategoryId: divisions.businessCategoryId }).from(divisions).where(eq(divisions.id, fixture.divisionAId)).limit(1))[0]!.businessCategoryId
    await fixture.db.insert(divisions).values({
      id: emptyDivisionId,
      businessCategoryId,
      code: id('empty-division-code'),
      name: `${fixture.userId} Empty Division`,
    })

    expect((await app.request('/divisions/list')).status).toBe(401)
    const limited = await makeLimitedSession()
    expect((await app.request('/divisions/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/projects/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)

    const adminDivisions = await (await app.request(`/divisions/list?search=${encodeURIComponent(fixture.userId)}`, { headers: { Cookie: fixture.cookie } })).json()
    expect(adminDivisions.data.map((row: { id: string }) => row.id)).toEqual(expect.arrayContaining([emptyDivisionId]))

    const scopedDivisions = await (await app.request('/divisions/list?permission=create-qhsse-pts', { headers: { Cookie: fixture.cookie } })).json()
    expect(scopedDivisions.data.map((row: { id: string }) => row.id)).toEqual([fixture.divisionAId])

    const scopedProjects = await (await app.request('/projects/list?permission=create-qhsse-pts', { headers: { Cookie: fixture.cookie } })).json()
    expect(scopedProjects.data.map((row: { id: string }) => row.id)).toEqual([fixture.projectAId])

    expect((await app.request('/divisions/list?permission=view-divisions', { headers: { Cookie: fixture.cookie } })).status).toBe(400)
    expect((await app.request('/projects/list?permission=unknown-code', { headers: { Cookie: fixture.cookie } })).status).toBe(400)

    const a = fixture.records[0]!
    const roots = await (await app.request(`/work-items/list?projectId=${fixture.projectAId}&rootOnly=true`, { headers: { Cookie: fixture.cookie } })).json()
    expect(roots.data.map((row: { id: string }) => row.id)).toEqual([a.rootId])
    const leaves = await (await app.request(`/work-items/list?projectId=${fixture.projectAId}&workItemCategoryId=${a.rootId}&leafOnly=true`, { headers: { Cookie: fixture.cookie } })).json()
    expect(leaves.data.map((row: { id: string }) => row.id)).toEqual([a.leafId])

    const projectUsers = await (await app.request(`/users/list?projectId=${fixture.projectAId}&statusCode=active&search=${encodeURIComponent(fixture.userId)}`, { headers: { Cookie: fixture.cookie } })).json()
    expect(projectUsers.data.map((row: { id: string }) => row.id)).toEqual([fixture.userId])
  })
})

async function makeLimitedSession() {
  const db = getDb()
  const userId = id('limited-user')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Limited User', email })
  await db.insert(accounts).values({ id: id('limited-account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  return { cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '' }
}

afterAll(() => closeDb())
