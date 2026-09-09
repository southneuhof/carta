import { defineRoute, notFound } from '@southneuhof/sprindle'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requirePermission } from '../../../../../identity'
import { permissions } from '../../../permissions/permissions.entity'
import { rolePermissions, roles } from '../../roles.entity'

export const GET = defineRoute({ authorize: requirePermission('list-role-permissions'), action: async (args) => {
  const role = (await getDb().select({ id: roles.id }).from(roles).where(eq(roles.id, args.params.roleId)).limit(1))[0]
  if (!role) throw notFound()
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
      eq(rolePermissions.roleId, args.params.roleId),
    ))
    .where(eq(permissions.active, true))
    .orderBy(permissions.permissionCode)
  const data = rows.map((row) => ({ ...row, assigned: row.assigned === true }))
  return { data, total: data.length }
} })
