import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { permissions, rolePermissions, roles } from './roles.entity'

async function exists(table: typeof roles | typeof permissions, id: string) {
  const rows = await getDb().select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1)
  return !!rows[0]
}

async function mappedPermission(permissionId: string, assigned: boolean) {
  const permission = await getDb().select().from(permissions).where(eq(permissions.id, permissionId)).limit(1)
  const { active: _active, ...rest } = permission[0]!
  return { ...rest, assigned }
}

/** Assignment is the `active` flag, not the row's existence — revoking keeps the history. */
async function setAssignment(roleId: string, permissionId: string, active: boolean) {
  await getDb()
    .insert(rolePermissions)
    .values({ roleId, permissionId, active })
    .onConflictDoUpdate({ target: [rolePermissions.roleId, rolePermissions.permissionId], set: { active } })
  return mappedPermission(permissionId, active)
}

export const listRolePermissions = defineRoute({
  path: '/roles/:roleId/permissions',
  method: 'get',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const roleId = c.req.param('roleId')
    if (!roleId) return c.json({ error: 'not_found' }, 404)
    if (!await exists(roles, roleId)) return c.json({ error: 'not_found' }, 404)
    const data = await getDb()
      .select({ id: permissions.id, code: permissions.code, name: permissions.name, assignedActive: rolePermissions.active })
      .from(permissions)
      .leftJoin(rolePermissions, and(eq(rolePermissions.permissionId, permissions.id), eq(rolePermissions.roleId, roleId)))
      .orderBy(permissions.id)
    return c.json({ data: data.map(({ assignedActive, ...permission }) => ({ ...permission, assigned: assignedActive === true })), total: data.length })
  },
})

export const assignRolePermission = defineRoute({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'put',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const { roleId, permissionId } = c.req.param()
    if (!await exists(roles, roleId) || !await exists(permissions, permissionId)) return c.json({ error: 'not_found' }, 404)
    return c.json({ data: await setAssignment(roleId, permissionId, true) })
  },
})

export const revokeRolePermission = defineRoute({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'delete',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const { roleId, permissionId } = c.req.param()
    if (!await exists(roles, roleId) || !await exists(permissions, permissionId)) return c.json({ error: 'not_found' }, 404)
    return c.json({ data: await setAssignment(roleId, permissionId, false) })
  },
})
