import { defineRoute } from '@southneuhof/sprindle/routes'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { permissions, rolePermissions, roles } from './roles.entity'

async function exists(table: typeof roles | typeof permissions, id: string) {
  const rows = await getDb().select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1)
  return !!rows[0]
}

async function mappedPermission(permissionId: string, assigned: boolean) {
  const permission = await getDb().select().from(permissions).where(eq(permissions.id, permissionId)).limit(1)
  return { ...permission[0]!, assigned }
}

export const listRolePermissions = defineRoute({
  path: '/roles/:roleId/permissions',
  method: 'get',
  action: async ({ c }) => {
    const roleId = c.req.param('roleId')
    if (!roleId) return c.json({ error: 'not_found' }, 404)
    if (!await exists(roles, roleId)) return c.json({ error: 'not_found' }, 404)
    const data = await getDb()
      .select({ id: permissions.id, name: permissions.name, assignedRoleId: rolePermissions.roleId })
      .from(permissions)
      .leftJoin(rolePermissions, and(eq(rolePermissions.permissionId, permissions.id), eq(rolePermissions.roleId, roleId)))
      .orderBy(permissions.id)
    return c.json({ data: data.map(({ assignedRoleId, ...permission }) => ({ ...permission, assigned: assignedRoleId != null })), total: data.length })
  },
})

export const assignRolePermission = defineRoute({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'put',
  action: async ({ c }) => {
    const { roleId, permissionId } = c.req.param()
    if (!await exists(roles, roleId) || !await exists(permissions, permissionId)) return c.json({ error: 'not_found' }, 404)
    await getDb().insert(rolePermissions).values({ roleId, permissionId }).onConflictDoNothing()
    return c.json({ data: await mappedPermission(permissionId, true) })
  },
})

export const revokeRolePermission = defineRoute({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'delete',
  action: async ({ c }) => {
    const { roleId, permissionId } = c.req.param()
    if (!await exists(roles, roleId) || !await exists(permissions, permissionId)) return c.json({ error: 'not_found' }, 404)
    await getDb().delete(rolePermissions).where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
    return c.json({ data: await mappedPermission(permissionId, false) })
  },
})
