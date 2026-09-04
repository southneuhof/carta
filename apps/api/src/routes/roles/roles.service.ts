import { HttpError, notFound } from '@southneuhof/sprindle'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb, type Tx } from '../../db'
import {
  permissions,
  roleAssignments,
  rolePermissions,
  roles,
} from './roles.entity'

function now() {
  return new Date().toISOString()
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
      assigned: rolePermissions.active,
    })
    .from(permissions)
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
      assigned: rolePermissions.active,
    })
    .from(permissions)
    .leftJoin(rolePermissions, and(
      eq(rolePermissions.permissionId, permissions.id),
      eq(rolePermissions.roleId, roleId),
    ))
    .where(eq(permissions.active, true))
    .orderBy(permissions.permissionCode)
  return rows.map((row) => ({ ...row, assigned: row.assigned === true }))
}

export async function setRolePermission(actorUserId: string, roleId: string, permissionId: string, active: boolean) {
  await getDb().transaction(async (tx) => {
    const foundRole = (await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0]
    const foundPermission = (await tx.select().from(permissions).where(eq(permissions.id, permissionId)).limit(1))[0]
    if (!foundRole || !foundPermission) throw notFound()
    if (active && !foundPermission.active) throw new HttpError(422, 'permission_inactive')
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
  })
  return rolePermissionState(roleId, permissionId)
}

export async function listRoleAssignments(userId: string) {
  const db = getDb()
  const [roleRows, assignmentRows] = await Promise.all([
    db.select({ id: roles.id, roleCode: roles.roleCode, name: roles.name, description: roles.description, active: roles.active })
      .from(roles).orderBy(roles.roleCode),
    db.select({ roleId: roleAssignments.roleId })
      .from(roleAssignments).where(and(eq(roleAssignments.userId, userId), eq(roleAssignments.active, true))),
  ])
  const assignedIds = new Set(assignmentRows.map((row) => row.roleId))
  return roleRows
    .filter((role) => role.active || assignedIds.has(role.id))
    .map((role) => ({ ...role, assigned: assignedIds.has(role.id) }))
}

export async function setRoleAssignment(actorUserId: string, userId: string, roleId: string, active: boolean) {
  await getDb().transaction(async (tx: Tx) => {
    const foundRole = (await tx.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0]
    if (!foundRole) throw notFound()
    if (active && !foundRole.active) throw new HttpError(422, 'role_inactive')
    const existing = (await tx.select().from(roleAssignments).where(and(
      eq(roleAssignments.userId, userId),
      eq(roleAssignments.roleId, roleId),
    )).limit(1))[0]
    if (active) {
      if (existing?.active) return
      if (existing) {
        await tx.update(roleAssignments).set({ active: true, updatedAt: now(), updatedByUserId: actorUserId }).where(eq(roleAssignments.id, existing.id))
        return
      }
      await tx.insert(roleAssignments).values({
        userId,
        roleId,
        active: true,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      })
      return
    }
    if (existing?.active) {
      await tx.update(roleAssignments).set({ active: false, updatedAt: now(), updatedByUserId: actorUserId }).where(eq(roleAssignments.id, existing.id))
    }
  })
  return listRoleAssignments(userId)
}

export async function assignInitialRoles(actorUserId: string, userId: string, roleIds: string[]) {
  const uniqueRoleIds = [...new Set(roleIds)]
  if (!uniqueRoleIds.length || uniqueRoleIds.length !== roleIds.length) throw new HttpError(422, 'roles_required')
  await getDb().transaction(async (tx) => {
    const foundRoles = await tx.select({ id: roles.id, active: roles.active }).from(roles).where(inArray(roles.id, uniqueRoleIds))
    if (foundRoles.length !== uniqueRoleIds.length || foundRoles.some((row) => !row.active)) throw new HttpError(422, 'roles_required')
    await tx.insert(roleAssignments).values(uniqueRoleIds.map((roleId) => ({
      userId,
      roleId,
      active: true,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    })))
  })
}

export async function validateInitialRoles(roleIds: string[]) {
  const uniqueRoleIds = [...new Set(roleIds)]
  if (!uniqueRoleIds.length || uniqueRoleIds.length !== roleIds.length) throw new HttpError(422, 'roles_required')
  const foundRoles = await getDb().select({ id: roles.id, active: roles.active }).from(roles).where(inArray(roles.id, uniqueRoleIds))
  if (foundRoles.length !== uniqueRoleIds.length || foundRoles.some((row) => !row.active)) throw new HttpError(422, 'roles_required')
  return uniqueRoleIds
}

export async function deleteUnassignedRole(roleId: string) {
  return getDb().transaction(async (tx) => {
    const assignments = await tx.select({ id: roleAssignments.id }).from(roleAssignments).where(and(eq(roleAssignments.roleId, roleId), eq(roleAssignments.active, true)))
    if (assignments.length) throw new HttpError(409, 'role_in_use', undefined, [{ field: 'assignmentCount', message: String(assignments.length) }])
    await tx.delete(roleAssignments).where(eq(roleAssignments.roleId, roleId))
    const deleted = await tx.delete(roles).where(eq(roles.id, roleId)).returning({ id: roles.id })
    if (!deleted[0]) throw notFound()
    return { ok: true }
  })
}
