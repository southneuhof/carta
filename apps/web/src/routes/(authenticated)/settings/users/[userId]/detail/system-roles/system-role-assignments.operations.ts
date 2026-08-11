import { parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import type { CollectionResult } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

type ListEndpoint = (typeof rpc.users)[':userId']['system-role-assignments']['$get']
type PutEndpoint = (typeof rpc.users)[':userId']['system-role-assignments'][':roleId']['$put']
type DeleteEndpoint = (typeof rpc.users)[':userId']['system-role-assignments'][':roleId']['$delete']
type ListResponse = HonoResponseOf<ListEndpoint, 200>
export type SystemRoleAssignment = ListResponse['data'][number]

export async function loadSystemRoleAssignments(userId: string): Promise<CollectionResult<SystemRoleAssignment>> {
  if (!userId) return { data: [] }
  const payload = await parseHonoResponse<ListEndpoint>(await rpc.users[':userId']['system-role-assignments'].$get({ param: { userId } }))
  return { data: payload.data, meta: { total: payload.total } }
}

export async function setSystemRoleAssignment(userId: string, roleId: string, assigned: boolean): Promise<SystemRoleAssignment> {
  const route = rpc.users[':userId']['system-role-assignments'][':roleId']
  const request = { param: { userId, roleId } }
  if (assigned) return (await parseHonoResponse<PutEndpoint>(await route.$put(request))).data
  return (await parseHonoResponse<DeleteEndpoint>(await route.$delete(request))).data
}
