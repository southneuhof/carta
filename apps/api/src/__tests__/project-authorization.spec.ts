import { afterAll, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { app } from '../app'
import { closeDb, getDb } from '../db'
import { accessibleProjectIds } from '../authorization'
import { accounts } from '../routes/auth/auth.entity'
import { getAuth } from '../routes/auth/auth'
import { businessCategories } from '../routes/business-categories/business-categories.entity'
import { divisions } from '../routes/divisions/divisions.entity'
import { authorizationModules, permissions, projectRoleAssignments, rolePermissions, roles, systemRoleAssignments } from '../routes/roles/roles.entity'
import { projects } from '../routes/projects/projects.entity'
import { projectVendors } from '../routes/project-vendors/project-vendors.entity'
import { ptsWorkCategories } from '../routes/pts-work-categories/pts-work-categories.entity'
import { qhssePts } from '../routes/qhsse-pts/qhsse-pts.entity'
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
    'view-projects',
    'manage-projects',
    'view-work-items',
    'manage-work-items',
    'view-project-vendors',
    'manage-project-vendors',
    'view-qhsse-pts',
    'show-qhsse-pts',
    'create-qhsse-pts',
    'update-qhsse-pts',
    'delete-qhsse-pts',
  ]
  const projectPermissionIds = await ensurePermissionIds(projectCodes, 'project')
  const createProjectId = (await ensurePermissionIds(['create-projects'], 'system')).get('create-projects')!

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
  await db.insert(rolePermissions).values({ roleId: systemRoleId, permissionId: createProjectId })
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

  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  return {
    db,
    userId,
    projectRoleId,
    categoryId,
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
  { name: 'exact project', coverageType: 'project', projectIds: ['projectAId'] as const, projectTotal: 1, recordTotal: 1, inaccessibleProject: 'projectBId' as const },
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
    const scopedProjectIds = (await accessibleProjectIds(fixture.userId, 'view-projects')).map(({ id }) => id)
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
      const inaccessibleIndex = inaccessibleProject === 'projectBId' ? 1 : 2
      expect((await (await app.request(`/projects/list?search=${encodeURIComponent(`${fixture.userId} Project ${String.fromCharCode(65 + inaccessibleIndex)}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
      expect((await (await app.request(`/project-vendors/list?search=${encodeURIComponent(`${fixture.userId} Vendor ${inaccessibleIndex}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
      expect((await (await app.request(`/work-items/list?search=${encodeURIComponent(`${fixture.userId} Leaf ${inaccessibleIndex}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
      expect((await (await app.request(`/qhsse-pts/list?search=${encodeURIComponent(`${fixture.userId} Report ${inaccessibleIndex}`)}`, { headers: { Cookie: fixture.cookie } })).json()).total).toBe(0)
    }
  })

  it.each(scopeCases)('$name coverage is returned by accessibleProjectIds', async ({ coverageType, projectIds }) => {
    const fixture = await makeFixture(coverageType)
    const rows = await accessibleProjectIds(fixture.userId, 'view-projects')
    const actual = new Set(rows.map(({ id }) => id))
    for (const key of projectIds) expect(actual).toContain(fixture[key])
    if (coverageType !== 'all_projects') expect(actual).toEqual(new Set(projectIds.map((key) => fixture[key])))
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

    const page = await app.request('/qhsse-pts/list?page=2&limit=1', { headers: { Cookie: fixture.cookie } })
    expect(page.status).toBe(200)
    const data = await page.json()
    expect(data.page).toBe(2)
    expect(data.limit).toBe(1)
    expect(data.total).toBe(3)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].projectId).toBe(fixture.projectAId)
  })

  it('uses one project scope for lists, details, trees, lookups, writes, and operations', async () => {
    const fixture = await makeFixture()
    const a = fixture.records[0]!
    const b = fixture.records[1]!
    const c = fixture.records[2]!

    const projectsResponse = await app.request('/projects/list', { headers: { Cookie: fixture.cookie } })
    expect(projectsResponse.status).toBe(200)
    const projectsData = await projectsResponse.json()
    expect(projectsData.total).toBe(1)
    expect(projectsData.data.map((row: { id: string }) => row.id)).toEqual([fixture.projectAId])
    expect(projectsData.data[0].allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect((await app.request(`/projects/detail/${fixture.projectAId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/projects/detail/${fixture.projectBId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(403)
    expect((await app.request(`/projects/detail/${fixture.projectCId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const vendorsResponse = await app.request('/project-vendors/list', { headers: { Cookie: fixture.cookie } })
    expect(vendorsResponse.status).toBe(200)
    const vendorsData = await vendorsResponse.json()
    expect(vendorsData.total).toBe(1)
    expect(vendorsData.data.map((row: { projectId: string }) => row.projectId)).toEqual([fixture.projectAId])
    expect(vendorsData.data[0].allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect((await app.request(`/project-vendors/detail/${b.vendorId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(403)

    const workItemsResponse = await app.request('/work-items/list', { headers: { Cookie: fixture.cookie } })
    expect(workItemsResponse.status).toBe(200)
    const workItemsData = await workItemsResponse.json()
    expect(workItemsData.total).toBe(2)
    expect(new Set(workItemsData.data.map((row: { projectId: string }) => row.projectId))).toEqual(new Set([fixture.projectAId]))
    expect(workItemsData.data.every((row: { allowedOperations: string[] }) => row.allowedOperations.join(',') === 'detail,update,delete')).toBe(true)
    const treeResponse = await app.request(`/work-items/tree/tree?projectId=${fixture.projectAId}`, { headers: { Cookie: fixture.cookie } })
    expect(treeResponse.status).toBe(200)
    expect(await treeResponse.json()).toMatchObject({ data: [{ id: a.rootId, allowedOperations: ['detail', 'update', 'delete'] }] })
    expect((await app.request(`/work-items/detail/${b.leafId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(403)

    const ptsListResponse = await app.request('/qhsse-pts/list', { headers: { Cookie: fixture.cookie } })
    expect(ptsListResponse.status).toBe(200)
    const ptsList = await ptsListResponse.json()
    expect(ptsList.total).toBe(1)
    expect(ptsList.data.map((row: { projectId: string }) => row.projectId)).toEqual([fixture.projectAId])
    expect(ptsList.data[0].allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect((await app.request(`/qhsse-pts/detail/${b.reportId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(403)
    expect((await app.request(`/qhsse-pts/detail/${c.reportId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const lookups = await app.request('/qhsse-pts/lookups', { headers: { Cookie: fixture.cookie } })
    expect(lookups.status).toBe(200)
    const lookupData = (await lookups.json()).data
    expect(lookupData.projects.map((row: { id: string }) => row.id)).toEqual([fixture.projectAId])
    expect(lookupData.projects[0].allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect(lookupData.workItems.every((row: { allowedOperations: string[] }) => row.allowedOperations.join(',') === 'detail,update,delete')).toBe(true)
    expect(lookupData.projectVendors[0].allowedOperations).toEqual(['detail', 'update', 'delete'])
    expect((await app.request(`/qhsse-pts/lookups?projectId=${fixture.projectBId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const workMove = await app.request(`/work-items/update/${a.leafId}`, {
      method: 'PATCH',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ projectId: fixture.projectBId }),
    })
    expect(workMove.status).toBe(403)
    const vendorMove = await app.request(`/project-vendors/update/${a.vendorId}`, {
      method: 'PATCH',
      headers: jsonHeaders(fixture.cookie),
      body: JSON.stringify({ projectId: fixture.projectBId }),
    })
    expect(vendorMove.status).toBe(403)
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
})

afterAll(() => closeDb())
