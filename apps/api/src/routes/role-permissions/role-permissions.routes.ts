import { defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'
import type { TypedResponse } from 'hono'
import { requireOrgIdentity, requirePermission } from '../../identity'
import { listRolePermissions as readRolePermissions, setRolePermission } from '../roles/roles.service'

type RolePermission = Awaited<ReturnType<typeof readRolePermissions>>[number]
type RolePermissionListOutput = { data: RolePermission[]; total: number } | TypedResponse<{ error: string }, 404, 'json'>
type RolePermissionMutationOutput = { data: Awaited<ReturnType<typeof setRolePermission>> } | TypedResponse<{ error: string }, 404, 'json'>

export const listRolePermissions = defineRoute<RolePermissionListOutput, ModelRuntimeContext, 'get', '/roles/:roleId/permissions', {}>({
  path: '/roles/:roleId/permissions',
  method: 'get',
  authorize: [requirePermission('list-role-permissions')],
  action: async (args) => {
    const roleId = args.c.req.param('roleId')
    if (!roleId) return args.c.json({ error: 'not_found' }, 404)
    const data = await readRolePermissions(roleId)
    return { data, total: data.length }
  },
})

export const assignRolePermission = defineRoute<RolePermissionMutationOutput, ModelRuntimeContext, 'put', '/roles/:roleId/permissions/:permissionId', {}>({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'put',
  authorize: [requirePermission('create-role-permissions')],
  action: async (args) => {
    const roleId = args.c.req.param('roleId')
    const permissionId = args.c.req.param('permissionId')
    if (!roleId || !permissionId) return args.c.json({ error: 'not_found' }, 404)
    return { data: await setRolePermission((await requireOrgIdentity(args)).userId, roleId, permissionId, true) }
  },
})

export const revokeRolePermission = defineRoute<RolePermissionMutationOutput, ModelRuntimeContext, 'delete', '/roles/:roleId/permissions/:permissionId', {}>({
  path: '/roles/:roleId/permissions/:permissionId',
  method: 'delete',
  authorize: [requirePermission('delete-role-permissions')],
  action: async (args) => {
    const roleId = args.c.req.param('roleId')
    const permissionId = args.c.req.param('permissionId')
    if (!roleId || !permissionId) return args.c.json({ error: 'not_found' }, 404)
    return { data: await setRolePermission((await requireOrgIdentity(args)).userId, roleId, permissionId, false) }
  },
})
