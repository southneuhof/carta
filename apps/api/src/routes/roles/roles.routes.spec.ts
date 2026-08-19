import { afterAll, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationAuditEvents, authorizationModules, permissions, projectRoleAssignments, rolePermissions, roles, systemRoleAssignments } from './roles.entity'
import { businessCategories } from '../business-categories/business-categories.entity'
import { divisions } from '../divisions/divisions.entity'
import { projects } from '../projects/projects.entity'
import { users } from '../users/users.entity'

function id(prefix: string) {
  return `roles-route-test-${prefix}-${crypto.randomUUID()}`
}

async function adminSession(grantAssignmentView = true) {
  const db = getDb()
  const userId = id('admin')
  const email = `${userId}@example.invalid`
  const moduleId = id('system-module')
  const projectModuleId = id('project-module')
  await db.insert(users).values({ id: userId, name: 'Roles Admin', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values([
    { id: moduleId, code: id('system-module-code'), name: 'System', realm: 'system' },
    { id: projectModuleId, code: id('project-module-code'), name: 'Project', realm: 'project' },
  ])
  const permissionIds = new Map<string, string>()
  for (const [code, module] of [
    ['delete-roles', moduleId],
    ['list-role-permissions', moduleId],
    ['create-role-permissions', moduleId],
    ['delete-role-permissions', moduleId],
    ['list-system-role-assignments', moduleId],
    ['create-system-role-assignments', moduleId],
    ['delete-system-role-assignments', moduleId],
    ['list-project-role-assignments', moduleId],
    ['create-project-role-assignments', moduleId],
    ['delete-project-role-assignments', moduleId],
    ['view-projects', projectModuleId],
  ] as const) {
    if (!grantAssignmentView && code === 'list-project-role-assignments') continue
    const permissionId = id(code)
    const permissionCode = code === 'view-projects' ? id('project-view-permission') : code
    await db.insert(permissions).values({ id: permissionId, permissionCode, name: code, moduleId: module }).onConflictDoNothing()
    permissionIds.set(code, (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, permissionCode)).limit(1))[0]!.id)
  }
  const adminRoleId = id('admin-role')
  await db.insert(roles).values({ id: adminRoleId, roleCode: id('admin-role-code'), name: 'Roles Admin', realm: 'system' })
  await db.insert(systemRoleAssignments).values({ userId, roleId: adminRoleId })
  for (const permissionId of permissionIds.values()) {
    if (permissionId !== permissionIds.get('view-projects')) await db.insert(rolePermissions).values({ roleId: adminRoleId, permissionId })
  }
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  return { userId, cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '', permissionIds }
}

describe('RBAC administration routes', () => {
  afterAll(() => closeDb())

  it('rejects cross-realm role permission mappings without an audit event', async () => {
    const state = await adminSession()
    const db = getDb()
    const roleId = id('role')
    await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'System Role', realm: 'system' })
    const before = (await db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    const response = await app.request(`/roles/${roleId}/permissions/${state.permissionIds.get('view-projects')}`, {
      method: 'PUT',
      headers: { Cookie: state.cookie },
    })
    expect(response.status).toBe(422)
    expect((await response.json()).error).toBe('realm_mismatch')
    expect((await db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length).toBe(before)
  })

  it('returns assignment counts and blocks assigned role deletion', async () => {
    const state = await adminSession()
    const db = getDb()
    const roleId = id('assigned-role')
    await db.insert(roles).values({ id: roleId, roleCode: id('assigned-role-code'), name: 'Assigned Role', realm: 'system' })
    await db.insert(systemRoleAssignments).values({ userId: state.userId, roleId })
    const blocked = await app.request(`/roles/delete/${roleId}`, { method: 'DELETE', headers: { Cookie: state.cookie } })
    expect(blocked.status).toBe(409)
    expect(await blocked.json()).toMatchObject({ error: 'role_in_use', systemAssignmentCount: 1, projectAssignmentCount: 0 })
    await db.update(systemRoleAssignments).set({ active: false }).where(eq(systemRoleAssignments.roleId, roleId))
    const deleted = await app.request(`/roles/delete/${roleId}`, { method: 'DELETE', headers: { Cookie: state.cookie } })
    expect(deleted.status).toBe(200)
  })

  it('returns referenced inactive division and exact-project options only', async () => {
    const state = await adminSession()
    const db = getDb()
    const targetUserId = id('options-target')
    const businessCategoryId = id('options-business-category')
    const referencedDivisionId = id('referenced-division')
    const unreferencedDivisionId = id('unreferenced-division')
    const referencedProjectId = id('referenced-project')
    const unreferencedProjectId = id('unreferenced-project')
    const projectRoleId = id('options-project-role')
    await db.insert(users).values({ id: targetUserId, name: 'Options Target', email: `${targetUserId}@example.invalid` })
    await db.insert(businessCategories).values({ id: businessCategoryId, code: id('options-business-code'), name: 'Options Business' })
    await db.insert(divisions).values([
      { id: referencedDivisionId, businessCategoryId, code: id('referenced-division-code'), name: 'Referenced Division', active: false },
      { id: unreferencedDivisionId, businessCategoryId, code: id('unreferenced-division-code'), name: 'Unreferenced Division', active: false },
    ])
    await db.insert(projects).values([
      { id: referencedProjectId, divisionId: referencedDivisionId, number: id('referenced-number'), integrationCode: id('referenced-integration'), name: 'Referenced Project', active: false },
      { id: unreferencedProjectId, divisionId: unreferencedDivisionId, number: id('unreferenced-number'), integrationCode: id('unreferenced-integration'), name: 'Unreferenced Project', active: false },
    ])
    await db.insert(roles).values({ id: projectRoleId, roleCode: id('options-role-code'), name: 'Options Project Role', realm: 'project' })
    await db.insert(projectRoleAssignments).values([
      { id: id('referenced-division-assignment'), userId: targetUserId, roleId: projectRoleId, coverageType: 'division', divisionId: referencedDivisionId, projectId: null },
      { id: id('referenced-project-assignment'), userId: targetUserId, roleId: projectRoleId, coverageType: 'project', divisionId: null, projectId: referencedProjectId },
    ])

    const response = await app.request(`/users/${targetUserId}/project-role-assignment-options`, { headers: { Cookie: state.cookie } })
    expect(response.status).toBe(200)
    const data = (await response.json()).data
    expect(data.divisions).toContainEqual({ id: referencedDivisionId, name: 'Referenced Division', active: false })
    expect(data.divisions).not.toContainEqual(expect.objectContaining({ id: unreferencedDivisionId }))
    expect(data.projects).toContainEqual(expect.objectContaining({ id: referencedProjectId, divisionId: referencedDivisionId, number: expect.any(String), name: 'Referenced Project', active: false }))
    expect(data.projects).not.toContainEqual(expect.objectContaining({ id: unreferencedProjectId }))
    for (const row of data.divisions) expect(Object.keys(row).sort()).toEqual(['active', 'id', 'name'])
    for (const row of data.projects) expect(Object.keys(row).sort()).toEqual(['active', 'divisionId', 'id', 'name', 'number'])
    const deniedState = await adminSession(false)
    const denied = await app.request(`/users/${targetUserId}/project-role-assignment-options`, { headers: { Cookie: deniedState.cookie } })
    expect(denied.status).toBe(403)
  })

  it('rejects cross-realm system and project assignment writes without audit events', async () => {
    const state = await adminSession()
    const db = getDb()
    const targetUserId = id('cross-realm-target')
    const systemRoleId = id('cross-realm-system-role')
    const projectRoleId = id('cross-realm-project-role')
    await db.insert(users).values({ id: targetUserId, name: 'Cross Realm Target', email: `${targetUserId}@example.invalid` })
    await db.insert(roles).values([
      { id: systemRoleId, roleCode: id('cross-realm-system-code'), name: 'Cross Realm System Role', realm: 'system' },
      { id: projectRoleId, roleCode: id('cross-realm-project-code'), name: 'Cross Realm Project Role', realm: 'project' },
    ])
    const before = (await db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    const systemResponse = await app.request(`/users/${targetUserId}/system-role-assignments/${projectRoleId}`, { method: 'PUT', headers: { Cookie: state.cookie } })
    expect(systemResponse.status).toBe(422)
    expect((await systemResponse.json()).error).toBe('realm_mismatch')
    const projectPutResponse = await app.request(`/users/${targetUserId}/project-role-assignments/${systemRoleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: state.cookie },
      body: JSON.stringify({ coverageType: 'all_projects' }),
    })
    expect(projectPutResponse.status).toBe(422)
    expect((await projectPutResponse.json()).error).toBe('realm_mismatch')
    const projectDeleteResponse = await app.request(`/users/${targetUserId}/project-role-assignments/${systemRoleId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: state.cookie },
      body: JSON.stringify({ coverageType: 'all_projects' }),
    })
    expect(projectDeleteResponse.status).toBe(422)
    expect((await projectDeleteResponse.json()).error).toBe('realm_mismatch')
    expect((await db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length).toBe(before)
  })
})
