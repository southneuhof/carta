import { afterAll, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { closeDb, getDb } from './db'
import {
  allowedProjectOperations,
  deleteUnassignedRole,
  hasProjectCoverage,
  hasProjectPermission,
  resolveSystemIdentity,
  setProjectRoleAssignment,
  setRolePermission,
  setSystemRoleAssignment,
} from './authorization'
import { authorizationModules, authorizationAuditEvents, permissions, projectRoleAssignments, rolePermissions, roles, systemRoleAssignments } from './routes/roles/roles.entity'
import { businessCategories } from './routes/business-categories/business-categories.entity'
import { divisions } from './routes/divisions/divisions.entity'
import { projects } from './routes/projects/projects.entity'
import { users } from './routes/users/users.entity'

function id(prefix: string) {
  return `authorization-test-${prefix}-${crypto.randomUUID()}`
}

async function permission(code: string, realm: 'system' | 'project') {
  const db = getDb()
  const moduleId = id(`module-${realm}`)
  await db.insert(authorizationModules).values({ id: moduleId, code: id(`module-code-${realm}`), name: realm, realm }).onConflictDoNothing()
  await db.insert(permissions).values({ id: id(`permission-${code}`), permissionCode: code, name: code, moduleId }).onConflictDoNothing()
  return (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, code)).limit(1))[0]!.id
}

async function fixture() {
  const db = getDb()
  const userId = id('user')
  const businessCategoryId = id('business-category')
  const divisionA = id('division-a')
  const divisionB = id('division-b')
  const projectA = id('project-a')
  const projectB = id('project-b')
  await db.insert(users).values({ id: userId, name: 'Authorization User', email: `${userId}@example.invalid` })
  await db.insert(businessCategories).values({ id: businessCategoryId, code: id('business-code'), name: 'Authorization Business' })
  await db.insert(divisions).values([
    { id: divisionA, businessCategoryId, code: id('division-a-code'), name: 'Division A' },
    { id: divisionB, businessCategoryId, code: id('division-b-code'), name: 'Division B' },
  ])
  await db.insert(projects).values([
    { id: projectA, divisionId: divisionA, number: id('number-a'), integrationCode: id('integration-a'), name: 'Project A' },
    { id: projectB, divisionId: divisionB, number: id('number-b'), integrationCode: id('integration-b'), name: 'Project B' },
  ])
  return { db, userId, divisionA, divisionB, projectA, projectB }
}

async function roleWithPermission(userId: string, code: string, realm: 'system' | 'project') {
  const db = getDb()
  const permissionId = await permission(code, realm)
  const roleId = id(`role-${realm}`)
  await db.insert(roles).values({ id: roleId, roleCode: id(`role-code-${realm}`), name: roleId, realm })
  await db.insert(rolePermissions).values({ roleId, permissionId })
  if (realm === 'system') await db.insert(systemRoleAssignments).values({ userId, roleId })
  return { roleId, permissionId }
}

describe('authorization resolver', () => {
  afterAll(() => closeDb())

  it('keeps exact, division, all-project, future-project, and moved-division coverage server-side', async () => {
    const state = await fixture()
    const exact = await roleWithPermission(state.userId, 'view-projects', 'project')
    await dbInsertProjectAssignment(state, exact.roleId, { coverageType: 'project', projectId: state.projectA })
    expect(await hasProjectPermission(state.userId, state.projectA, 'view-projects')).toBe(true)
    expect(await hasProjectPermission(state.userId, state.projectB, 'view-projects')).toBe(false)

    const division = await roleWithPermission(state.userId, 'view-projects', 'project')
    await dbInsertProjectAssignment(state, division.roleId, { coverageType: 'division', divisionId: state.divisionA })
    expect(await hasProjectPermission(state.userId, state.projectA, 'view-projects')).toBe(true)
    expect(await hasProjectPermission(state.userId, state.projectB, 'view-projects')).toBe(false)
    const projectC = id('project-c')
    await state.db.insert(projects).values({ id: projectC, divisionId: state.divisionA, number: id('number-c'), integrationCode: id('integration-c'), name: 'Project C' })
    expect(await hasProjectPermission(state.userId, projectC, 'view-projects')).toBe(true)
    await state.db.update(projects).set({ divisionId: state.divisionB }).where(eq(projects.id, projectC))
    expect(await hasProjectPermission(state.userId, projectC, 'view-projects')).toBe(false)

    const all = await roleWithPermission(state.userId, 'view-projects', 'project')
    await dbInsertProjectAssignment(state, all.roleId, { coverageType: 'all_projects' })
    expect(await hasProjectPermission(state.userId, state.projectB, 'view-projects')).toBe(true)
    expect(await hasProjectCoverage(state.userId, state.projectB)).toBe(true)
  })

  it('keeps system and project realms isolated and removes inactive links', async () => {
    const state = await fixture()
    await roleWithPermission(state.userId, 'view-users', 'system')
    const project = await roleWithPermission(state.userId, 'view-projects', 'project')
    await dbInsertProjectAssignment(state, project.roleId, { coverageType: 'project', projectId: state.projectA })
    const identity = await resolveSystemIdentity(state.userId)
    expect(identity?.permissions.has('view-users')).toBe(true)
    expect(identity?.permissions.has('view-projects')).toBe(false)
    await state.db.update(roles).set({ active: false }).where(eq(roles.id, project.roleId))
    expect(await hasProjectPermission(state.userId, state.projectA, 'view-projects')).toBe(false)
    await state.db.update(roles).set({ active: false }).where(eq(roles.id, (await dbRoleForUser(state.userId))!))
    expect(await resolveSystemIdentity(state.userId)).toBeTruthy()
    await state.db.update(users).set({ statusCode: 'inactive' }).where(eq(users.id, state.userId))
    expect(await resolveSystemIdentity(state.userId)).toBeNull()
  })

  it('unions permissions from multiple active system roles', async () => {
    const state = await fixture()
    await roleWithPermission(state.userId, 'view-users', 'system')
    await roleWithPermission(state.userId, 'create-users', 'system')
    const identity = await resolveSystemIdentity(state.userId)
    expect(identity?.permissions.has('view-users')).toBe(true)
    expect(identity?.permissions.has('create-users')).toBe(true)
  })

  it('removes system access when each grant-chain link is inactive', async () => {
    const state = await fixture()
    const grant = await roleWithPermission(state.userId, 'view-users', 'system')
    const moduleId = (await state.db.select({ moduleId: permissions.moduleId }).from(permissions).where(eq(permissions.id, grant.permissionId)).limit(1))[0]!.moduleId
    const expectGranted = async (granted: boolean) => expect(Boolean((await resolveSystemIdentity(state.userId))?.permissions.has('view-users'))).toBe(granted)

    await expectGranted(true)
    await state.db.update(users).set({ statusCode: 'inactive' }).where(eq(users.id, state.userId))
    await expectGranted(false)
    await state.db.update(users).set({ statusCode: 'active' }).where(eq(users.id, state.userId))
    await state.db.update(systemRoleAssignments).set({ active: false }).where(and(eq(systemRoleAssignments.userId, state.userId), eq(systemRoleAssignments.roleId, grant.roleId)))
    await expectGranted(false)
    await state.db.update(systemRoleAssignments).set({ active: true }).where(and(eq(systemRoleAssignments.userId, state.userId), eq(systemRoleAssignments.roleId, grant.roleId)))
    await state.db.update(roles).set({ active: false }).where(eq(roles.id, grant.roleId))
    await expectGranted(false)
    await state.db.update(roles).set({ active: true }).where(eq(roles.id, grant.roleId))
    await state.db.update(rolePermissions).set({ active: false }).where(and(eq(rolePermissions.roleId, grant.roleId), eq(rolePermissions.permissionId, grant.permissionId)))
    await expectGranted(false)
    await state.db.update(rolePermissions).set({ active: true }).where(and(eq(rolePermissions.roleId, grant.roleId), eq(rolePermissions.permissionId, grant.permissionId)))
    await state.db.update(permissions).set({ active: false }).where(eq(permissions.id, grant.permissionId))
    await expectGranted(false)
    await state.db.update(permissions).set({ active: true }).where(eq(permissions.id, grant.permissionId))
    await state.db.update(authorizationModules).set({ active: false }).where(eq(authorizationModules.id, moduleId))
    await expectGranted(false)
    await state.db.update(authorizationModules).set({ active: true }).where(eq(authorizationModules.id, moduleId))
  })

  it('removes project access when each grant-chain link is inactive', async () => {
    const state = await fixture()
    const grant = await roleWithPermission(state.userId, 'view-projects', 'project')
    await dbInsertProjectAssignment(state, grant.roleId, { coverageType: 'project', projectId: state.projectA })
    const moduleId = (await state.db.select({ moduleId: permissions.moduleId }).from(permissions).where(eq(permissions.id, grant.permissionId)).limit(1))[0]!.moduleId
    const expectGranted = async (granted: boolean) => expect(await hasProjectPermission(state.userId, state.projectA, 'view-projects')).toBe(granted)

    await expectGranted(true)
    await state.db.update(users).set({ statusCode: 'inactive' }).where(eq(users.id, state.userId))
    await expectGranted(false)
    await state.db.update(users).set({ statusCode: 'active' }).where(eq(users.id, state.userId))
    await state.db.update(projectRoleAssignments).set({ active: false }).where(and(eq(projectRoleAssignments.userId, state.userId), eq(projectRoleAssignments.roleId, grant.roleId)))
    await expectGranted(false)
    await state.db.update(projectRoleAssignments).set({ active: true }).where(and(eq(projectRoleAssignments.userId, state.userId), eq(projectRoleAssignments.roleId, grant.roleId)))
    await state.db.update(roles).set({ active: false }).where(eq(roles.id, grant.roleId))
    await expectGranted(false)
    await state.db.update(roles).set({ active: true }).where(eq(roles.id, grant.roleId))
    await state.db.update(rolePermissions).set({ active: false }).where(and(eq(rolePermissions.roleId, grant.roleId), eq(rolePermissions.permissionId, grant.permissionId)))
    await expectGranted(false)
    await state.db.update(rolePermissions).set({ active: true }).where(and(eq(rolePermissions.roleId, grant.roleId), eq(rolePermissions.permissionId, grant.permissionId)))
    await state.db.update(permissions).set({ active: false }).where(eq(permissions.id, grant.permissionId))
    await expectGranted(false)
    await state.db.update(permissions).set({ active: true }).where(eq(permissions.id, grant.permissionId))
    await state.db.update(authorizationModules).set({ active: false }).where(eq(authorizationModules.id, moduleId))
    await expectGranted(false)
    await state.db.update(authorizationModules).set({ active: true }).where(eq(authorizationModules.id, moduleId))
  })

  it('batches allowed operations by project', async () => {
    const state = await fixture()
    const role = await roleWithPermission(state.userId, 'view-projects', 'project')
    const manage = await roleWithPermission(state.userId, 'manage-projects', 'project')
    await dbInsertProjectAssignment(state, role.roleId, { coverageType: 'project', projectId: state.projectA })
    await dbInsertProjectAssignment(state, manage.roleId, { coverageType: 'project', projectId: state.projectA })
    const allowed = await allowedProjectOperations(state.userId, [state.projectA, state.projectB], { detail: 'view-projects', update: 'manage-projects', delete: 'manage-projects' })
    expect(allowed.get(state.projectA)).toEqual(['detail', 'update', 'delete'])
    expect(allowed.get(state.projectB)).toEqual([])
  })

  it('normalizes broader assignments and rejects covered narrower rows', async () => {
    const state = await fixture()
    const role = await roleWithPermission(state.userId, 'view-projects', 'project')
    await setProjectRoleAssignment(state.userId, state.userId, role.roleId, { coverageType: 'project', projectId: state.projectA }, true)
    await setProjectRoleAssignment(state.userId, state.userId, role.roleId, { coverageType: 'division', divisionId: state.divisionA }, true)
    const rows = await state.db.select({ coverageType: projectRoleAssignments.coverageType, active: projectRoleAssignments.active }).from(projectRoleAssignments).where(eq(projectRoleAssignments.roleId, role.roleId))
    expect(rows).toEqual(expect.arrayContaining([{ coverageType: 'project', active: false }, { coverageType: 'division', active: true }]))
    await expect(setProjectRoleAssignment(state.userId, state.userId, role.roleId, { coverageType: 'project', projectId: state.projectA }, true)).rejects.toMatchObject({ status: 409, code: 'assignment_already_covered' })
    await setProjectRoleAssignment(state.userId, state.userId, role.roleId, { coverageType: 'all_projects' }, true)
    const normalized = await state.db.select({ coverageType: projectRoleAssignments.coverageType, active: projectRoleAssignments.active }).from(projectRoleAssignments).where(eq(projectRoleAssignments.roleId, role.roleId))
    expect(normalized.filter((row) => row.active)).toEqual([{ coverageType: 'all_projects', active: true }])
  })

  it('audits idempotent mappings and blocks assigned role deletion', async () => {
    const state = await fixture()
    const role = await roleWithPermission(state.userId, 'view-users', 'system')
    const permissionId = await permission('view-roles', 'system')
    const before = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    await setRolePermission(state.userId, role.roleId, permissionId, true)
    await setRolePermission(state.userId, role.roleId, permissionId, true)
    const after = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    expect(after).toBe(before + 1)
    await expect(deleteUnassignedRole(role.roleId)).rejects.toMatchObject({ status: 409, code: 'role_in_use' })
    await state.db.update(systemRoleAssignments).set({ active: false }).where(eq(systemRoleAssignments.roleId, role.roleId))
    await expect(deleteUnassignedRole(role.roleId)).resolves.toEqual({ ok: true })
  })

  it('does not audit retries of system or project role assignments', async () => {
    const state = await fixture()
    const systemPermissionId = await permission('view-users', 'system')
    const systemRoleId = id('retry-system-role')
    await state.db.insert(roles).values({ id: systemRoleId, roleCode: id('retry-system-code'), name: 'Retry System Role', realm: 'system' })
    await state.db.insert(rolePermissions).values({ roleId: systemRoleId, permissionId: systemPermissionId })
    const projectRole = await roleWithPermission(state.userId, 'view-projects', 'project')
    const before = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    await setSystemRoleAssignment(state.userId, state.userId, systemRoleId, true)
    await setSystemRoleAssignment(state.userId, state.userId, systemRoleId, true)
    const afterSystem = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    await setProjectRoleAssignment(state.userId, state.userId, projectRole.roleId, { coverageType: 'project', projectId: state.projectA }, true)
    await setProjectRoleAssignment(state.userId, state.userId, projectRole.roleId, { coverageType: 'project', projectId: state.projectA }, true)
    const afterProject = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    expect(afterSystem).toBe(before + 1)
    expect(afterProject).toBe(afterSystem + 1)
  })

  it('allows idempotent role-permission deletes after catalog deactivation', async () => {
    const state = await fixture()
    const permissionId = await permission('view-roles', 'system')
    const moduleId = (await state.db.select({ moduleId: permissions.moduleId }).from(permissions).where(eq(permissions.id, permissionId)).limit(1))[0]!.moduleId
    const permissionRoleId = id('inactive-permission-role')
    const moduleRoleId = id('inactive-module-role')
    await state.db.insert(roles).values([
      { id: permissionRoleId, roleCode: id('inactive-permission-role-code'), name: 'Inactive Permission Role', realm: 'system' },
      { id: moduleRoleId, roleCode: id('inactive-module-role-code'), name: 'Inactive Module Role', realm: 'system' },
    ])
    await setRolePermission(state.userId, permissionRoleId, permissionId, true)
    let before = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    await state.db.update(permissions).set({ active: false }).where(eq(permissions.id, permissionId))
    await setRolePermission(state.userId, permissionRoleId, permissionId, false)
    await setRolePermission(state.userId, permissionRoleId, permissionId, false)
    let after = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    expect(after).toBe(before + 1)
    expect((await state.db.select({ active: rolePermissions.active }).from(rolePermissions).where(and(eq(rolePermissions.roleId, permissionRoleId), eq(rolePermissions.permissionId, permissionId))).limit(1))[0]?.active).toBe(false)
    await state.db.update(permissions).set({ active: true }).where(eq(permissions.id, permissionId))

    await setRolePermission(state.userId, moduleRoleId, permissionId, true)
    before = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    await state.db.update(authorizationModules).set({ active: false }).where(eq(authorizationModules.id, moduleId))
    await setRolePermission(state.userId, moduleRoleId, permissionId, false)
    await setRolePermission(state.userId, moduleRoleId, permissionId, false)
    after = (await state.db.select({ id: authorizationAuditEvents.id }).from(authorizationAuditEvents)).length
    expect(after).toBe(before + 1)
    expect((await state.db.select({ active: rolePermissions.active }).from(rolePermissions).where(and(eq(rolePermissions.roleId, moduleRoleId), eq(rolePermissions.permissionId, permissionId))).limit(1))[0]?.active).toBe(false)
    await state.db.update(authorizationModules).set({ active: true }).where(eq(authorizationModules.id, moduleId))
  })
})

async function dbInsertProjectAssignment(state: Awaited<ReturnType<typeof fixture>>, roleId: string, coverage: { coverageType: 'all_projects' } | { coverageType: 'division'; divisionId: string } | { coverageType: 'project'; projectId: string }) {
  await state.db.insert(projectRoleAssignments).values({
    id: id('assignment'),
    userId: state.userId,
    roleId,
    coverageType: coverage.coverageType,
    divisionId: coverage.coverageType === 'division' ? coverage.divisionId : null,
    projectId: coverage.coverageType === 'project' ? coverage.projectId : null,
  })
}

async function dbRoleForUser(userId: string) {
  return (await getDb().select({ roleId: roles.id }).from(systemRoleAssignments).innerJoin(roles, eq(roles.id, systemRoleAssignments.roleId)).where(eq(systemRoleAssignments.userId, userId)).limit(1))[0]?.roleId
}
