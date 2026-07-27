import { parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import type { CollectionResult } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

type ListEndpoint = (typeof rpc.users)[':userId']['roles']['$get']
type ListResponse = HonoResponseOf<ListEndpoint, 200>
export type UserRole = ListResponse['data'][number]

export async function loadUserRoles(userId: string): Promise<CollectionResult<UserRole>> {
  if (!userId) return { data: [] }
  const payload = await parseHonoResponse<ListEndpoint>(await rpc.users[':userId'].roles.$get({ param: { userId } }))
  return { data: payload.data, meta: { total: payload.total } }
}

export async function setUserRole(userId: string, roleId: string, assigned: boolean): Promise<void> {
  const route = rpc.users[':userId'].roles[':roleId']
  const request = { param: { userId, roleId } }
  if (assigned) await parseHonoResponse<typeof route.$put>(await route.$put(request))
  else await parseHonoResponse<typeof route.$delete>(await route.$delete(request))
}
