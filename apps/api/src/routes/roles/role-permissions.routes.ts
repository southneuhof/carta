import { unauthorized } from '@southneuhof/sprindle'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { orgIdentity, requirePermission } from '../../identity'
import { listRolePermissions as readRolePermissions, setRolePermission } from '../../authorization'

async function actor(args: Parameters<typeof orgIdentity>[0]) {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity.userId
}

export const listRolePermissions = defineRoute({
  path: '/roles/:roleId/permissions',
  method: 'get',
  authorize: [authenticated(), requirePermission('view-role-permissions')],
  action: async (args) => {
    const roleId = args.c.req.param('roleId')
    if (!roleId) return args.c.json({ error: 'not_found' }, 404)
    const data = await readRolePermissions(roleId)
    return args.c.json({ data, total: data.length })
  },
})

export const assignRolePermission = defineRoute({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'put',
  authorize: [authenticated(), requirePermission('manage-role-permissions')],
  action: async (args) => {
    const roleId = args.c.req.param('roleId')
    const permissionId = args.c.req.param('permissionId')
    if (!roleId || !permissionId) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await setRolePermission(await actor(args), roleId, permissionId, true) })
  },
})

export const revokeRolePermission = defineRoute({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'delete',
  authorize: [authenticated(), requirePermission('manage-role-permissions')],
  action: async (args) => {
    const roleId = args.c.req.param('roleId')
    const permissionId = args.c.req.param('permissionId')
    if (!roleId || !permissionId) return args.c.json({ error: 'not_found' }, 404)
    return args.c.json({ data: await setRolePermission(await actor(args), roleId, permissionId, false) })
  },
})
