import type { CollectionResult } from '@southneuhof/is-vue-framework'
import { parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { rolesActions } from '../../../roles.actions'
import type { RolePermission } from './role-permissions.schema'

type ListEndpoint = (typeof rpc.roles)[':roleId']['permissions']['$get']
type ListResponse = HonoResponseOf<ListEndpoint, 200>

async function list({ searchParameters }: { searchParameters: Record<string, unknown> }): Promise<CollectionResult<RolePermission>> {
  const roleId = String(searchParameters.role_id ?? '')
  if (!roleId) return { data: [] }
  const [role, result] = await Promise.all([
    rolesActions.detail({ id: roleId, searchParameters: {} }),
    loadRolePermissions(roleId),
  ])
  if (!role) throw new Error('Role not found.')
  if (result.data.some((row) => row.module.realm !== role.realm)) throw new Error('Permission catalog realm mismatch.')
  return result
}

async function loadRolePermissions(roleId: string): Promise<CollectionResult<RolePermission>> {
  const payload = await parseHonoResponse<ListEndpoint>(await rpc.roles[':roleId'].permissions.$get({ param: { roleId } }))
  return { data: payload.data as RolePermission[], meta: { total: payload.total } }
}

async function set(roleId: string, permissionId: string, assigned: boolean): Promise<RolePermission> {
  const route = rpc.roles[':roleId'].permissions[':permissionId']
  const request = { param: { roleId, permissionId } }
  if (assigned) return (await parseHonoResponse<typeof route.$put>(await route.$put(request))).data as RolePermission
  return (await parseHonoResponse<typeof route.$delete>(await route.$delete(request))).data as RolePermission
}

export const rolePermissionsActions = { list, set }
