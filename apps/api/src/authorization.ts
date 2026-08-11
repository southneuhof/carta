import { forbidden, HttpError, notFound } from '@southneuhof/sprindle'
import { and, eq, inArray, isNotNull, or } from 'drizzle-orm'
import type { PermissionCode } from './authorization/catalog'
import { getDb } from './db'
import {
  authorizationAuditEvents,
  authorizationModules,
  coverageSchema,
  permissions,
  projectRoleAssignments,
  roles,
  rolePermissions,
  systemRoleAssignments,
  type CoverageInput,
  type CoverageType,
} from './routes/roles/roles.entity'
import { divisions } from './routes/divisions/divisions.entity'
import { projects } from './routes/projects/projects.entity'
import { users } from './routes/users/users.entity'

export type SystemIdentity = {
  userId: string
  user: {
    id: string
    name: string
    email: string
    username: string | null
    statusCode: string
  }
  roleCodes: string[]
  permissions: ReadonlySet<PermissionCode>
}

export type ProjectOperation = 'detail' | 'update' | 'delete'
export type AllowedOperations = ProjectOperation[]
export type ProjectOperationMap = Partial<Record<ProjectOperation, PermissionCode>>

function now() {
  return new Date().toISOString()
}

function projectCoverageCondition() {
  return or(
    eq(projectRoleAssignments.coverageType, 'all_projects'),
    and(
      eq(projectRoleAssignments.coverageType, 'division'),
      eq(projectRoleAssignments.divisionId, projects.divisionId),
    ),
    and(
      eq(projectRoleAssignments.coverageType, 'project'),
      eq(projectRoleAssignments.projectId, projects.id),
    ),
  )
}

function activeProjectGrantCondition(userId: string, permissionCode?: PermissionCode) {
  return and(
    eq(projectRoleAssignments.userId, userId),
    eq(projectRoleAssignments.active, true),
    eq(users.statusCode, 'active'),
    eq(roles.active, true),
    eq(roles.realm, 'project'),
    eq(rolePermissions.active, true),
    eq(permissions.active, true),
    eq(authorizationModules.active, true),
    eq(authorizationModules.realm, 'project'),
    permissionCode ? eq(permissions.permissionCode, permissionCode) : undefined,
    projectCoverageCondition(),
  )
}

export async function resolveSystemIdentity(userId: string): Promise<SystemIdentity | null> {
  const db = getDb()
  const profile = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      statusCode: users.statusCode,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const user = profile[0]
  if (!user || user.statusCode !== 'active') return null

  const activeRoles = await db
    .select({ roleCode: roles.roleCode })
    .from(systemRoleAssignments)
    .innerJoin(roles, eq(roles.id, systemRoleAssignments.roleId))
    .where(and(
      eq(systemRoleAssignments.userId, userId),
      eq(systemRoleAssignments.active, true),
      eq(roles.active, true),
      eq(roles.realm, 'system'),
    ))

  const granted = await db
    .select({ code: permissions.permissionCode })
    .from(systemRoleAssignments)
    .innerJoin(roles, eq(roles.id, systemRoleAssignments.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .innerJoin(authorizationModules, eq(authorizationModules.id, permissions.moduleId))
    .where(and(
      eq(systemRoleAssignments.userId, userId),
      eq(systemRoleAssignments.active, true),
      eq(roles.active, true),
      eq(roles.realm, 'system'),
      eq(rolePermissions.active, true),
      eq(permissions.active, true),
      eq(authorizationModules.active, true),
      eq(authorizationModules.realm, 'system'),
    ))

  return {
    userId,
    user,
    roleCodes: activeRoles.map(({ roleCode }) => roleCode),
    permissions: new Set(granted.map(({ code }) => code as PermissionCode)),
  }
}

export async function hasProjectCoverage(userId: string, projectId: string) {
  const rows = await getDb()
    .select({ id: projectRoleAssignments.id })
    .from(projectRoleAssignments)
    .innerJoin(users, eq(users.id, projectRoleAssignments.userId))
    .innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId))
    .innerJoin(projects, eq(projects.id, projectId))
    .where(and(
      eq(projectRoleAssignments.userId, userId),
      eq(projectRoleAssignments.active, true),
      eq(users.statusCode, 'active'),
      eq(roles.active, true),
      eq(roles.realm, 'project'),
      or(
        eq(projectRoleAssignments.coverageType, 'all_projects'),
        and(eq(projectRoleAssignments.coverageType, 'division'), eq(projectRoleAssignments.divisionId, projects.divisionId)),
        and(eq(projectRoleAssignments.coverageType, 'project'), eq(projectRoleAssignments.projectId, projects.id)),
      ),
    ))
    .limit(1)
  return Boolean(rows[0])
}

async function projectPermissionRows(userId: string, permissionCodes: PermissionCode[], projectIds?: string[]) {
  if (projectIds?.length === 0) return []
  return getDb()
    .selectDistinct({ projectId: projects.id, permissionCode: permissions.permissionCode })
    .from(projects)
    .innerJoin(projectRoleAssignments, projectCoverageCondition())
    .innerJoin(users, eq(users.id, projectRoleAssignments.userId))
    .innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .innerJoin(authorizationModules, eq(authorizationModules.id, permissions.moduleId))
    .where(and(
      activeProjectGrantCondition(userId),
      inArray(permissions.permissionCode, permissionCodes),
      projectIds ? inArray(projects.id, projectIds) : undefined,
    ))
}

export function accessibleProjectIds(userId: string, permissionCode: PermissionCode) {
  return getDb()
    .selectDistinct({ id: projects.id })
    .from(projects)
    .innerJoin(projectRoleAssignments, projectCoverageCondition())
    .innerJoin(users, eq(users.id, projectRoleAssignments.userId))
    .innerJoin(roles, eq(roles.id, projectRoleAssignments.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .innerJoin(authorizationModules, eq(authorizationModules.id, permissions.moduleId))
    .where(activeProjectGrantCondition(userId, permissionCode))
}

export async function hasProjectPermission(userId: string, projectId: string, code: PermissionCode) {
  const rows = await projectPermissionRows(userId, [code], [projectId])
  return Boolean(rows[0])
}

export async function requireProjectRecord(userId: string, projectId: string, permissionCode: PermissionCode) {
  if (!(await hasProjectCoverage(userId, projectId))) throw notFound()
  if (!(await hasProjectPermission(userId, projectId, permissionCode))) throw forbidden()
}

export async function allowedProjectPermissions(userId: string, projectIds: string[], permissionCodes: PermissionCode[]) {
  const codes = [...new Set(permissionCodes)]
  const rows = codes.length ? await projectPermissionRows(userId, codes, projectIds) : []
  const byProject = new Map<string, Set<PermissionCode>>()
  for (const row of rows) {
    const permissionsForProject = byProject.get(row.projectId) ?? new Set<PermissionCode>()
    permissionsForProject.add(row.permissionCode as PermissionCode)
    byProject.set(row.projectId, permissionsForProject)
  }
  return byProject
}

export async function allowedProjectOperations(userId: string, projectIds: string[], operationMap: ProjectOperationMap) {
  const entries = Object.entries(operationMap) as Array<[ProjectOperation, PermissionCode]>
  const byProject = await allowedProjectPermissions(userId, projectIds, entries.map(([, code]) => code))
  return new Map(projectIds.map((projectId) => {
    const granted = byProject.get(projectId) ?? new Set<PermissionCode>()
    return [projectId, entries.filter(([, code]) => granted.has(code)).map(([operation]) => operation)] as const
  }))
}

async function audit(tx: any, input: {
  actorUserId: string
  eventType: string
  targetUserId?: string
  roleId?: string
  coverageType?: CoverageType
  divisionId?: string | null
  projectId?: string | null
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}) {
  await tx.insert(authorizationAuditEvents).values({
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    targetUserId: input.targetUserId,
    roleId: input.roleId,
    coverageType: input.coverageType,
    divisionId: input.divisionId,
    projectId: input.projectId,
    before: input.before ?? {},
    after: input.after ?? {},
  })
}

async function roleRow(roleId: string) {
  return (await getDb().select().from(roles).where(eq(roles.id, roleId)).limit(1))[0]
}

async function rolePermissionState(roleId: string, permissionId: string) {
  const row = (await getDb()
    .select({
      id: permissions.id,
      permissionCode: permissions.permissionCode,
      name: permissions.name,
      description: permissions.description,
      module: {
        id: authorizationModules.id,
        code: authorizationModules.code,
        name: authorizationModules.name,
        realm: authorizationModules.realm,
      },
      assigned: rolePermissions.active,
    })
    .from(permissions)
    .innerJoin(authorizationModules, eq(authorizationModules.id, permissions.moduleId))
    .leftJoin(rolePermissions, and(
      eq(rolePermissions.permissionId, permissions.id),
      eq(rolePermissions.roleId, roleId),
    ))
    .where(eq(permissions.id, permissionId))
    .limit(1))[0]
  if (!row) throw notFound()
  return { ...row, assigned: row.assigned === true }
}

export async function listRolePermissions(roleId: string) {
  const foundRole = await roleRow(roleId)
  if (!foundRole) throw notFound()
  const rows = await getDb()
    .select({
      id: permissions.id,
      permissionCode: permissions.permissionCode,
      name: permissions.name,
      description: permissions.description,
      module: {
        id: authorizationModules.id,
        code: authorizationModules.code,
        name: authorizationModules.name,
        realm: authorizationModules.realm,
      },
      assigned: rolePermissions.active,
    })
    .from(permissions)
    .innerJoin(authorizationModules, eq(authorizationModules.id, permissions.moduleId))
    .leftJoin(rolePermissions, and(
      eq(rolePermissions.permissionId, permissions.id),
      eq(rolePermissions.roleId, roleId),
    ))
    .where(and(
      eq(permissions.active, true),
      eq(authorizationModules.active, true),
      eq(authorizationModules.realm, foundRole.realm),
    ))
    .orderBy(authorizationModules.code, permissions.permissionCode)
  return rows.map((row) => ({ ...row, assigned: row.assigned === true }))
}

export async function setRolePermission(actorUserId: string, roleId: string, permissionId: string, active: boolean) {
  await getDb().transaction(async (tx) => {
    const foundRole = (await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0]
    const foundPermission = (await tx.select().from(permissions).where(eq(permissions.id, permissionId)).limit(1))[0]
    if (!foundRole || !foundPermission) throw notFound()
    const module = (await tx.select().from(authorizationModules).where(eq(authorizationModules.id, foundPermission.moduleId)).limit(1))[0]
    if (!module || foundRole.realm !== module.realm) throw new HttpError(422, 'realm_mismatch')
    if (active && (!foundPermission.active || !module.active)) throw new HttpError(422, 'permission_inactive')
    const existing = (await tx.select().from(rolePermissions).where(and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId),
    )).limit(1))[0]
    if (existing?.active === active || (!existing && !active)) return
    if (existing) {
      await tx.update(rolePermissions).set({ active, updatedAt: now(), updatedByUserId: actorUserId }).where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId),
      ))
    } else {
      await tx.insert(rolePermissions).values({ roleId, permissionId, active, createdByUserId: actorUserId, updatedByUserId: actorUserId })
    }
    await audit(tx, {
      actorUserId,
      eventType: 'role_permission_changed',
      roleId,
      before: { active: existing?.active ?? false, permissionId },
      after: { active, permissionId },
    })
  })
  return rolePermissionState(roleId, permissionId)
}

export async function setSystemRoleAssignment(actorUserId: string, userId: string, roleId: string, active: boolean) {
  await getDb().transaction(async (tx) => {
    const foundRole = (await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0]
    if (!foundRole) throw notFound()
    if (foundRole.realm !== 'system') throw new HttpError(422, 'realm_mismatch')
    if (active && !foundRole.active) throw new HttpError(422, 'role_inactive')
    const existing = (await tx.select().from(systemRoleAssignments).where(and(
      eq(systemRoleAssignments.userId, userId),
      eq(systemRoleAssignments.roleId, roleId),
    )).limit(1))[0]
    if (existing?.active === active || (!existing && !active)) return
    if (existing) {
      await tx.update(systemRoleAssignments).set({ active, updatedAt: now(), updatedByUserId: actorUserId }).where(and(
        eq(systemRoleAssignments.userId, userId),
        eq(systemRoleAssignments.roleId, roleId),
      ))
    } else {
      await tx.insert(systemRoleAssignments).values({ userId, roleId, active, createdByUserId: actorUserId, updatedByUserId: actorUserId })
    }
    await audit(tx, {
      actorUserId,
      eventType: 'system_role_assignment_changed',
      targetUserId: userId,
      roleId,
      before: { active: existing?.active ?? false },
      after: { active },
    })
  })
  const found = (await getDb().select({
    id: roles.id,
    roleCode: roles.roleCode,
    name: roles.name,
    description: roles.description,
    active: roles.active,
  }).from(roles).where(eq(roles.id, roleId)).limit(1))[0]
  if (!found) throw notFound()
  return { ...found, assigned: active }
}

export async function listSystemRoleAssignments(userId: string) {
  const rows = await getDb()
    .select({
      id: roles.id,
      roleCode: roles.roleCode,
      name: roles.name,
      description: roles.description,
      active: roles.active,
      assigned: systemRoleAssignments.active,
    })
    .from(roles)
    .leftJoin(systemRoleAssignments, and(
      eq(systemRoleAssignments.roleId, roles.id),
      eq(systemRoleAssignments.userId, userId),
    ))
    .where(and(
      eq(roles.realm, 'system'),
      or(eq(roles.active, true), isNotNull(systemRoleAssignments.roleId)),
    ))
    .orderBy(roles.roleCode)
  return rows.map((row) => ({ ...row, assigned: row.assigned === true }))
}

export async function assignInitialSystemRoles(actorUserId: string, userId: string, roleIds: string[]) {
  const uniqueRoleIds = [...new Set(roleIds)]
  if (!uniqueRoleIds.length || uniqueRoleIds.length !== roleIds.length) throw new HttpError(422, 'system_roles_required')
  await getDb().transaction(async (tx) => {
    const foundRoles = await tx.select({ id: roles.id, active: roles.active, realm: roles.realm }).from(roles).where(inArray(roles.id, uniqueRoleIds))
    if (foundRoles.length !== uniqueRoleIds.length || foundRoles.some((row) => !row.active || row.realm !== 'system')) throw new HttpError(422, 'system_roles_required')
    await tx.insert(systemRoleAssignments).values(uniqueRoleIds.map((roleId) => ({
      userId,
      roleId,
      active: true,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    })))
    for (const roleId of uniqueRoleIds) {
      await audit(tx, {
        actorUserId,
        eventType: 'system_role_assignment_created',
        targetUserId: userId,
        roleId,
        before: {},
        after: { active: true },
      })
    }
  })
}

export async function validateInitialSystemRoles(roleIds: string[]) {
  const uniqueRoleIds = [...new Set(roleIds)]
  if (!uniqueRoleIds.length || uniqueRoleIds.length !== roleIds.length) throw new HttpError(422, 'system_roles_required')
  const foundRoles = await getDb().select({ id: roles.id, active: roles.active, realm: roles.realm }).from(roles).where(inArray(roles.id, uniqueRoleIds))
  if (foundRoles.length !== uniqueRoleIds.length || foundRoles.some((row) => !row.active || row.realm !== 'system')) throw new HttpError(422, 'system_roles_required')
  return uniqueRoleIds
}

export async function listProjectRoleAssignmentOptions(userId: string) {
  const db = getDb()
  const assignments = await db.select({ divisionId: projectRoleAssignments.divisionId, projectId: projectRoleAssignments.projectId })
    .from(projectRoleAssignments)
    .where(eq(projectRoleAssignments.userId, userId))
  const divisionIds = new Set(assignments.map(({ divisionId }) => divisionId).filter((id): id is string => Boolean(id)))
  const projectIds = new Set(assignments.map(({ projectId }) => projectId).filter((id): id is string => Boolean(id)))
  const [divisionRows, projectRows] = await Promise.all([
    db.select({ id: divisions.id, name: divisions.name, active: divisions.active }).from(divisions),
    db.select({ id: projects.id, divisionId: projects.divisionId, number: projects.number, name: projects.name, active: projects.active }).from(projects),
  ])
  return {
    divisions: divisionRows.filter((row) => row.active || divisionIds.has(row.id)),
    projects: projectRows.filter((row) => row.active || projectIds.has(row.id)),
  }
}

function selectedCoverageMatches(row: { coverageType: CoverageType; divisionId: string | null; projectId: string | null }, coverage: CoverageInput) {
  if (coverage.coverageType === 'all_projects') return row.coverageType === 'all_projects'
  if (coverage.coverageType === 'division') return row.coverageType === 'division' && row.divisionId === coverage.divisionId
  return row.coverageType === 'project' && row.projectId === coverage.projectId
}

export async function listProjectRoleAssignments(userId: string, rawCoverage: unknown) {
  const coverage = coverageSchema.parse(rawCoverage)
  const db = getDb()
  let projectDivisionId: string | undefined
  if (coverage.coverageType === 'division') {
    const division = (await db.select({ id: divisions.id }).from(divisions).where(eq(divisions.id, coverage.divisionId)).limit(1))[0]
    if (!division) throw notFound()
  }
  if (coverage.coverageType === 'project') {
    const project = (await db.select({ divisionId: projects.divisionId }).from(projects).where(eq(projects.id, coverage.projectId)).limit(1))[0]
    if (!project) throw notFound()
    projectDivisionId = project.divisionId
  }
  const [roleRows, assignmentRows, divisionRows] = await Promise.all([
    db.select({ id: roles.id, roleCode: roles.roleCode, name: roles.name, description: roles.description, active: roles.active })
      .from(roles).where(eq(roles.realm, 'project')).orderBy(roles.roleCode),
    db.select({ roleId: projectRoleAssignments.roleId, coverageType: projectRoleAssignments.coverageType, divisionId: projectRoleAssignments.divisionId, projectId: projectRoleAssignments.projectId, active: projectRoleAssignments.active })
      .from(projectRoleAssignments).where(and(eq(projectRoleAssignments.userId, userId), eq(projectRoleAssignments.active, true))),
    db.select({ id: divisions.id, name: divisions.name }).from(divisions),
  ])
  const divisionNames = new Map(divisionRows.map((row) => [row.id, row.name]))
  const matchesSource = (row: typeof assignmentRows[number]) => {
    if (coverage.coverageType === 'all_projects') return false
    if (row.coverageType === 'all_projects') return true
    if (coverage.coverageType === 'division') return false
    return row.coverageType === 'division' && row.divisionId === projectDivisionId
  }
  const activeRoleIds = new Set(assignmentRows.filter((row) => selectedCoverageMatches(row, coverage) || matchesSource(row)).map((row) => row.roleId))
  return roleRows
    .filter((roleRow) => roleRow.active || activeRoleIds.has(roleRow.id))
    .map((roleRow) => {
      const directRow = assignmentRows.find((row) => selectedCoverageMatches(row, coverage) && row.roleId === roleRow.id)
      const sourceRow = assignmentRows.find((row) => matchesSource(row) && row.roleId === roleRow.id)
      const direct = Boolean(directRow)
      const effective = direct || Boolean(sourceRow)
      const source = sourceRow
        ? {
            coverageType: sourceRow.coverageType,
            divisionId: sourceRow.divisionId,
            projectId: sourceRow.projectId,
            divisionName: sourceRow.divisionId ? divisionNames.get(sourceRow.divisionId) : undefined,
            label: sourceRow.coverageType === 'all_projects' ? 'Assigned for All Projects' : `Assigned for ${divisionNames.get(sourceRow.divisionId ?? '') ?? 'this division'}`,
          }
        : null
      return { ...roleRow, direct, effective, locked: Boolean(source && !direct), source }
    })
}

async function findProjectForCoverage(coverage: CoverageInput) {
  if (coverage.coverageType === 'division') {
    const division = (await getDb().select({ id: divisions.id }).from(divisions).where(eq(divisions.id, coverage.divisionId)).limit(1))[0]
    if (!division) throw notFound()
  }
  if (coverage.coverageType === 'project') {
    const project = (await getDb().select({ id: projects.id, divisionId: projects.divisionId }).from(projects).where(eq(projects.id, coverage.projectId)).limit(1))[0]
    if (!project) throw notFound()
    return project
  }
  return undefined
}

async function assignmentAt(tx: any, userId: string, roleId: string, coverage: CoverageInput) {
  const conditions = [eq(projectRoleAssignments.userId, userId), eq(projectRoleAssignments.roleId, roleId), eq(projectRoleAssignments.coverageType, coverage.coverageType)]
  if (coverage.coverageType === 'all_projects') conditions.push(isNotNull(projectRoleAssignments.id))
  if (coverage.coverageType === 'division') conditions.push(eq(projectRoleAssignments.divisionId, coverage.divisionId))
  if (coverage.coverageType === 'project') conditions.push(eq(projectRoleAssignments.projectId, coverage.projectId))
  return (await tx.select().from(projectRoleAssignments).where(and(...conditions)).limit(1))[0]
}

async function saveAssignment(tx: any, userId: string, roleId: string, coverage: CoverageInput, actorUserId: string) {
  const existing = await assignmentAt(tx, userId, roleId, coverage)
  if (existing) {
    if (existing.active) return existing
    return (await tx.update(projectRoleAssignments).set({ active: true, updatedAt: now(), updatedByUserId: actorUserId }).where(eq(projectRoleAssignments.id, existing.id)).returning())[0]
  }
  return (await tx.insert(projectRoleAssignments).values({
    userId,
    roleId,
    coverageType: coverage.coverageType,
    divisionId: coverage.coverageType === 'division' ? coverage.divisionId : null,
    projectId: coverage.coverageType === 'project' ? coverage.projectId : null,
    active: true,
    createdByUserId: actorUserId,
    updatedByUserId: actorUserId,
  }).returning())[0]
}

export async function setProjectRoleAssignment(actorUserId: string, userId: string, roleId: string, rawCoverage: unknown, active: boolean) {
  const coverage = coverageSchema.parse(rawCoverage)
  await getDb().transaction(async (tx) => {
    const foundRole = (await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0]
    if (!foundRole) throw notFound()
    if (foundRole.realm !== 'project') throw new HttpError(422, 'realm_mismatch')
    if (active && !foundRole.active) throw new HttpError(422, 'role_inactive')

    if (!active) {
      const existing = await assignmentAt(tx, userId, roleId, coverage)
      if (!existing || !existing.active) return
      await tx.update(projectRoleAssignments).set({ active: false, updatedAt: now(), updatedByUserId: actorUserId }).where(eq(projectRoleAssignments.id, existing.id))
      await audit(tx, {
        actorUserId,
        eventType: 'project_role_assignment_changed',
        targetUserId: userId,
        roleId,
        coverageType: coverage.coverageType,
        divisionId: existing.divisionId,
        projectId: existing.projectId,
        before: { active: true },
        after: { active: false },
      })
      return
    }

    const project = await findProjectForCoverage(coverage)
    const current = await tx.select().from(projectRoleAssignments).where(and(
      eq(projectRoleAssignments.userId, userId),
      eq(projectRoleAssignments.roleId, roleId),
      eq(projectRoleAssignments.active, true),
    ))
    if (coverage.coverageType === 'division' && current.some((row) => row.coverageType === 'all_projects')) throw new HttpError(409, 'assignment_already_covered')
    if (coverage.coverageType === 'project' && current.some((row) => row.coverageType === 'all_projects' || (row.coverageType === 'division' && row.divisionId === project?.divisionId))) throw new HttpError(409, 'assignment_already_covered')
    const changed: Array<{ id: string; active: boolean }> = []
    const saved = await saveAssignment(tx, userId, roleId, coverage, actorUserId)
    if (!saved) throw new HttpError(500, 'assignment_failed')
    if (coverage.coverageType === 'all_projects') {
      const rows = current.filter((row) => row.coverageType !== 'all_projects' && row.active)
      if (rows.length) {
        await tx.update(projectRoleAssignments).set({ active: false, updatedAt: now(), updatedByUserId: actorUserId }).where(inArray(projectRoleAssignments.id, rows.map((row) => row.id)))
        changed.push(...rows.map((row) => ({ id: row.id, active: false })))
      }
    }
    if (coverage.coverageType === 'division') {
      const projectIds = current.filter((row) => row.coverageType === 'project' && row.projectId && row.active).map((row) => row.projectId!)
      const projectRows = projectIds.length
        ? await tx.select({ id: projects.id }).from(projects).where(and(inArray(projects.id, projectIds), eq(projects.divisionId, coverage.divisionId)))
        : []
      const projectRowIds = new Set(projectRows.map((row) => row.id))
      const coveredRows = current.filter((row) => row.coverageType === 'project' && row.projectId && projectRowIds.has(row.projectId) && row.active)
      if (coveredRows.length) {
        await tx.update(projectRoleAssignments).set({ active: false, updatedAt: now(), updatedByUserId: actorUserId }).where(inArray(projectRoleAssignments.id, coveredRows.map((row) => row.id)))
        changed.push(...coveredRows.map((row) => ({ id: row.id, active: false })))
      }
    }
    const wasActive = current.some((row) => row.id === saved.id && row.active)
    if (!wasActive || changed.length) {
      await audit(tx, {
        actorUserId,
        eventType: 'project_role_assignment_changed',
        targetUserId: userId,
        roleId,
        coverageType: coverage.coverageType,
        divisionId: coverage.coverageType === 'division' ? coverage.divisionId : null,
        projectId: coverage.coverageType === 'project' ? coverage.projectId : null,
        before: { activeRows: current.filter((row) => row.active).map((row) => row.id) },
        after: { activeRows: [...current.filter((row) => row.active && row.id !== saved.id).map((row) => row.id), saved.id].filter((id) => !changed.some((row) => row.id === id)) },
      })
    }
  })
  return listProjectRoleAssignments(userId, coverage)
}

export async function deleteUnassignedRole(roleId: string) {
  return getDb().transaction(async (tx) => {
    const system = await tx.select({ id: systemRoleAssignments.roleId }).from(systemRoleAssignments).where(and(eq(systemRoleAssignments.roleId, roleId), eq(systemRoleAssignments.active, true)))
    const project = await tx.select({ id: projectRoleAssignments.roleId }).from(projectRoleAssignments).where(and(eq(projectRoleAssignments.roleId, roleId), eq(projectRoleAssignments.active, true)))
    if (system.length || project.length) throw new HttpError(409, 'role_in_use', undefined, [
      { field: 'systemAssignmentCount', message: String(system.length) },
      { field: 'projectAssignmentCount', message: String(project.length) },
    ])
    await tx.delete(systemRoleAssignments).where(eq(systemRoleAssignments.roleId, roleId))
    await tx.delete(projectRoleAssignments).where(eq(projectRoleAssignments.roleId, roleId))
    const deleted = await tx.delete(roles).where(eq(roles.id, roleId)).returning({ id: roles.id })
    if (!deleted[0]) throw notFound()
    return { ok: true }
  })
}
