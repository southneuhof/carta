import { parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import type { CollectionResult } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

type ListEndpoint = (typeof rpc.roles)[':roleId']['permissions']['$get']
type ListResponse = HonoResponseOf<ListEndpoint, 200>
export type RolePermission = ListResponse['data'][number]

export async function loadRolePermissions(roleId: string): Promise<CollectionResult<RolePermission>> {
  if (!roleId) return { data: [] }
  const payload = await parseHonoResponse<ListEndpoint>(await rpc.roles[':roleId'].permissions.$get({ param: { roleId } }))
  return { data: payload.data, meta: { total: payload.total } }
}

export async function setRolePermission(roleId: string, permissionId: string, assigned: boolean): Promise<void> {
  const route = rpc.roles[':roleId'].permissions[':permissionId']
  const request = { param: { roleId, permissionId } }
  if (assigned) await parseHonoResponse<typeof route.$put>(await route.$put(request))
  else await parseHonoResponse<typeof route.$delete>(await route.$delete(request))
}
