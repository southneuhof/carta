import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { users } from '../users/users.entity'
import { role, roles, userRoles } from './roles.entity'

async function userExists(id: string) {
  const rows = await getDb().select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)
  return !!rows[0]
}

async function roleExists(id: string) {
  const rows = await getDb().select({ id: roles.id }).from(roles).where(eq(roles.id, id)).limit(1)
  return !!rows[0]
}

async function mappedRole(roleId: string, assigned: boolean) {
  const found = await getDb().select().from(roles).where(eq(roles.id, roleId)).limit(1)
  return { ...role.schemas.select.parse(found[0]), assigned }
}

/** Assignment is the `active` flag, not the row's existence — mirrors role permissions. */
async function setAssignment(userId: string, roleId: string, active: boolean) {
  await getDb()
    .insert(userRoles)
    .values({ userId, roleId, active })
    .onConflictDoUpdate({ target: [userRoles.userId, userRoles.roleId], set: { active } })
  return mappedRole(roleId, active)
}

export const listUserRoles = defineRoute({
  path: '/users/:userId/roles',
  method: 'get',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const userId = c.req.param('userId')
    if (!userId || !await userExists(userId)) return c.json({ error: 'not_found' }, 404)
    const data = await getDb()
      .select({ id: roles.id, name: roles.name, scope: roles.scope, assignedActive: userRoles.active })
      .from(roles)
      .leftJoin(userRoles, and(eq(userRoles.roleId, roles.id), eq(userRoles.userId, userId)))
      .orderBy(roles.id)
    return c.json({ data: data.map(({ assignedActive, ...found }) => ({ ...found, assigned: assignedActive === true })), total: data.length })
  },
})

export const assignUserRole = defineRoute({
  path: '/users/:userId/roles/:roleId',
  method: 'put',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const { userId, roleId } = c.req.param()
    if (!await userExists(userId) || !await roleExists(roleId)) return c.json({ error: 'not_found' }, 404)
    return c.json({ data: await setAssignment(userId, roleId, true) })
  },
})

export const revokeUserRole = defineRoute({
  path: '/users/:userId/roles/:roleId',
  method: 'delete',
  authorize: [authenticated()],
  action: async ({ c }) => {
    const { userId, roleId } = c.req.param()
    if (!await userExists(userId) || !await roleExists(roleId)) return c.json({ error: 'not_found' }, 404)
    return c.json({ data: await setAssignment(userId, roleId, false) })
  },
})
