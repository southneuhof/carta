import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { projects } from '../projects/projects.entity'
import { users } from '../users/users.entity'
import { role, roles, projectUsers } from './roles.entity'

async function assignment(projectId: string, userId: string, roleId: string, active: boolean) {
  const found = (
    await getDb()
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.assignmentScope, 'project'), eq(roles.active, true)))
      .limit(1)
  )[0]
  if (!found) return null
  await getDb()
    .insert(projectUsers)
    .values({ projectId, userId, roleId, active })
    .onConflictDoUpdate({
      target: [projectUsers.projectId, projectUsers.userId, projectUsers.roleId],
      set: { active },
    })
  return { ...role.schemas.select.parse(found), projectId, userId, active }
}

export const listProjectUsers = defineRoute({
  path: '/projects/:projectId/users',
  method: 'get',
  authorize: [authenticated(), requirePermission('view-project-users')],
  action: async ({ c }) => {
    const projectId = c.req.param('projectId')
    if (!projectId) return c.json({ error: 'not_found' }, 404)
    const project = (await getDb().select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1))[0]
    if (!project) return c.json({ error: 'not_found' }, 404)
    const data = await getDb()
      .select({
        projectId: projectUsers.projectId,
        userId: projectUsers.userId,
        roleId: projectUsers.roleId,
        active: projectUsers.active,
        username: users.username,
        name: users.name,
        roleCode: roles.roleCode,
        roleName: roles.name,
      })
      .from(projectUsers)
      .innerJoin(users, eq(users.id, projectUsers.userId))
      .innerJoin(roles, eq(roles.id, projectUsers.roleId))
      .where(eq(projectUsers.projectId, projectId))
      .orderBy(users.name, roles.roleCode)
    return c.json({ data, total: data.length })
  },
})

export const assignProjectUser = defineRoute({
  path: '/projects/:projectId/users/:userId/:roleId',
  method: 'put',
  authorize: [authenticated(), requirePermission('manage-project-users')],
  action: async ({ c }) => {
    const { projectId, userId, roleId } = c.req.param()
    if (!projectId || !userId || !roleId) return c.json({ error: 'not_found' }, 404)
    const [project, user] = await Promise.all([
      getDb().select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1),
      getDb().select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1),
    ])
    if (!project[0] || !user[0]) return c.json({ error: 'not_found' }, 404)
    const result = await assignment(projectId, userId, roleId, true)
    return result ? c.json({ data: result }) : c.json({ error: 'project_role_required' }, 422)
  },
})

export const revokeProjectUser = defineRoute({
  path: '/projects/:projectId/users/:userId/:roleId',
  method: 'delete',
  authorize: [authenticated(), requirePermission('manage-project-users')],
  action: async ({ c }) => {
    const { projectId, userId, roleId } = c.req.param()
    if (!projectId || !userId || !roleId) return c.json({ error: 'not_found' }, 404)
    const result = await assignment(projectId, userId, roleId, false)
    return result ? c.json({ data: result }) : c.json({ error: 'project_role_required' }, 422)
  },
})
