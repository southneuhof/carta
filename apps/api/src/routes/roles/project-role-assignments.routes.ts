import { unauthorized } from '@southneuhof/sprindle'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { eq } from 'drizzle-orm'
import { orgIdentity, requirePermission } from '../../identity'
import { getDb } from '../../db'
import { coverageSchema } from './roles.entity'
import {
  listProjectRoleAssignmentOptions as readProjectRoleAssignmentOptions,
  listProjectRoleAssignments as readProjectRoleAssignments,
  setProjectRoleAssignment,
} from '../../authorization'
import { users } from '../users/users.entity'

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity.userId
}

async function userExists(userId: string) {
  return Boolean((await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1))[0])
}

function queryCoverage(args: Parameters<typeof readProjectRoleAssignments>[1]) {
  return coverageSchema.parse(args)
}

function coverageFromQuery(query: Record<string, string | undefined>) {
  if (query.coverageType === 'division') return queryCoverage({ coverageType: 'division', divisionId: query.divisionId })
  if (query.coverageType === 'project') return queryCoverage({ coverageType: 'project', projectId: query.projectId })
  return queryCoverage({ coverageType: 'all_projects' })
}

export const listProjectRoleAssignmentOptions = defineRoute({
  path: '/users/:userId/project-role-assignment-options',
  method: 'get',
  authorize: [authenticated(), requirePermission('view-project-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    if (!userId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await readProjectRoleAssignmentOptions(userId) })
  },
})

export const listProjectRoleAssignments = defineRoute({
  path: '/users/:userId/project-role-assignments',
  method: 'get',
  authorize: [authenticated(), requirePermission('view-project-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    if (!userId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    const data = await readProjectRoleAssignments(userId, coverageFromQuery(args.c.req.query()))
    return args.c.json({ data, total: data.length })
  },
})

export const assignProjectRole = defineRoute({
  path: '/users/:userId/project-role-assignments/:roleId',
  method: 'put',
  authorize: [authenticated(), requirePermission('manage-project-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    const roleId = args.c.req.param('roleId')
    if (!userId || !roleId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    const coverage = coverageSchema.parse(await args.c.req.json().catch(() => ({})))
    return args.c.json({ data: await setProjectRoleAssignment(await actor(args), userId, roleId, coverage, true) })
  },
})

export const revokeProjectRole = defineRoute({
  path: '/users/:userId/project-role-assignments/:roleId',
  method: 'delete',
  authorize: [authenticated(), requirePermission('manage-project-role-assignments')],
  action: async (args) => {
    const userId = args.c.req.param('userId')
    const roleId = args.c.req.param('roleId')
    if (!userId || !roleId || !(await userExists(userId))) return args.c.json({ error: 'not_found' }, 404)
    const coverage = coverageSchema.parse(await args.c.req.json().catch(() => ({})))
    return args.c.json({ data: await setProjectRoleAssignment(await actor(args), userId, roleId, coverage, false) })
  },
})
