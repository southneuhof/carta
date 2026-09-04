import type { CollectionLoadContext, CollectionResult } from '@southneuhof/loom'
import { parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { RoleAssignment, RoleAssignmentQuery } from './role-assignments.schema'

type ListEndpoint = (typeof rpc.users)[':userId']['role-assignments']['$get']
type ListResponse = HonoResponseOf<ListEndpoint, 200>

async function list({ query, searchParameters }: CollectionLoadContext<RoleAssignmentQuery>): Promise<CollectionResult<RoleAssignment>> {
  const userId = String(searchParameters.userId ?? '')
  if (!userId) return { data: [] }
  const payload = await parseHonoResponse<ListEndpoint>(await rpc.users[':userId']['role-assignments'].$get({ param: { userId }, query: {} }))
  const search = String((query as Record<string, unknown>).search ?? '')
    .trim()
    .toLowerCase()
  const data = (payload.data as ListResponse['data'] as RoleAssignment[]).filter(
    (row) =>
      !search ||
      [row.roleCode, row.name, row.description].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(search)
      )
  )
  return { data, meta: { total: data.length } }
}

async function set(userId: string, roleId: string, assigned: boolean): Promise<RoleAssignment[]> {
  const route = rpc.users[':userId']['role-assignments'][':roleId']
  const request = { param: { userId, roleId } }
  if (assigned) return (await parseHonoResponse<typeof route.$put>(await route.$put(request))).data as RoleAssignment[]
  return (await parseHonoResponse<typeof route.$delete>(await route.$delete(request))).data as RoleAssignment[]
}

export const roleAssignmentsActions = { list, set }
