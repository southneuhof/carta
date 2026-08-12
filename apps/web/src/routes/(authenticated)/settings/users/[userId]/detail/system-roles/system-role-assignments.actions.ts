import type { CollectionResult } from '@southneuhof/is-vue-framework'
import { parseHonoResponse } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { SystemRoleAssignment } from './system-role-assignments.schema'

type ListEndpoint = (typeof rpc.users)[':userId']['system-role-assignments']['$get']

async function list({ searchParameters }: { searchParameters: Record<string, unknown> }): Promise<CollectionResult<SystemRoleAssignment>> {
  const userId = String(searchParameters.userId ?? '')
  if (!userId) return { data: [] }
  const payload = await parseHonoResponse<ListEndpoint>(await rpc.users[':userId']['system-role-assignments'].$get({ param: { userId } }))
  return { data: payload.data as SystemRoleAssignment[], meta: { total: payload.total } }
}

async function set(userId: string, roleId: string, assigned: boolean): Promise<SystemRoleAssignment> {
  const route = rpc.users[':userId']['system-role-assignments'][':roleId']
  const request = { param: { userId, roleId } }
  if (assigned) return (await parseHonoResponse<typeof route.$put>(await route.$put(request))).data as SystemRoleAssignment
  return (await parseHonoResponse<typeof route.$delete>(await route.$delete(request))).data as SystemRoleAssignment
}

export const systemRoleAssignmentsActions = { list, set }
