import { defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'
import type { TypedResponse } from 'hono'
import { eq } from 'drizzle-orm'
import { requireOrgIdentity, requirePermission } from '../../identity'
import { getDb } from '../../db'
import {
  listRoleAssignments as readRoleAssignments,
  setRoleAssignment,
} from '../roles/roles.service'
import { users } from '../users/users.entity'

type RoleAssignment = Awaited<ReturnType<typeof readRoleAssignments>>[number]
type ListOutput = { data: RoleAssignment[]; total: number } | TypedResponse<{ error: string }, 404, 'json'>
type MutationOutput = { data: Awaited<ReturnType<typeof setRoleAssignment>> } | TypedResponse<{ error: string }, 404, 'json'>

async function userExists(userId: string) {
  return Boolean((await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1))[0])
}

export const listRoleAssignments = defineRoute<ListOutput, ModelRuntimeContext, 'get', '/users/:userId/role-assignments', { query: Record<string, string | undefined> }>({
  path: '/users/:userId/role-assignments',
  method: 'get',
  authorize: [requirePermission('list-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    if (!userId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    const data = await readRoleAssignments(userId)
    return { data, total: data.length }
  },
})

export const assignRole = defineRoute<MutationOutput, ModelRuntimeContext, 'put', '/users/:userId/role-assignments/:roleId', {}>({
  path: '/users/:userId/role-assignments/:roleId',
  method: 'put',
  authorize: [requirePermission('create-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    const roleId = args.c.req.param('roleId')
    if (!userId || !roleId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    return { data: await setRoleAssignment((await requireOrgIdentity(args)).userId, userId, roleId, true) }
  },
})

export const revokeRole = defineRoute<MutationOutput, ModelRuntimeContext, 'delete', '/users/:userId/role-assignments/:roleId', {}>({
  path: '/users/:userId/role-assignments/:roleId',
  method: 'delete',
  authorize: [requirePermission('delete-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    const roleId = args.c.req.param('roleId')
    if (!userId || !roleId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    return { data: await setRoleAssignment((await requireOrgIdentity(args)).userId, userId, roleId, false) }
  },
})
