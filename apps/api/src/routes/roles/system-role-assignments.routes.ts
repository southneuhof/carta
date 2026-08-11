import { unauthorized } from '@southneuhof/sprindle'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { eq } from 'drizzle-orm'
import { orgIdentity, requirePermission } from '../../identity'
import { getDb } from '../../db'
import { listSystemRoleAssignments as readSystemRoleAssignments, setSystemRoleAssignment } from '../../authorization'
import { users } from '../users/users.entity'

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity.userId
}

async function userExists(userId: string) {
  return Boolean((await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1))[0])
}

export const listSystemRoleAssignments = defineRoute({
  path: '/users/:userId/system-role-assignments',
  method: 'get',
  authorize: [authenticated(), requirePermission('view-system-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    if (!userId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    const data = await readSystemRoleAssignments(userId)
    return args.c.json({ data, total: data.length })
  },
})

export const assignSystemRole = defineRoute({
  path: '/users/:userId/system-role-assignments/:roleId',
  method: 'put',
  authorize: [authenticated(), requirePermission('manage-system-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    const roleId = args.c.req.param('roleId')
    if (!userId || !roleId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await setSystemRoleAssignment(await actor(args), userId, roleId, true) })
  },
})

export const revokeSystemRole = defineRoute({
  path: '/users/:userId/system-role-assignments/:roleId',
  method: 'delete',
  authorize: [authenticated(), requirePermission('manage-system-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    const roleId = args.c.req.param('roleId')
    if (!userId || !roleId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await setSystemRoleAssignment(await actor(args), userId, roleId, false) })
  },
})
