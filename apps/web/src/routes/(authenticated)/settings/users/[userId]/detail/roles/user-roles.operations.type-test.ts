import type { HonoRequestOf, HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'

type ListEndpoint = (typeof rpc.users)[':userId']['roles']['$get']
type AssignEndpoint = (typeof rpc.users)[':userId']['roles'][':roleId']['$put']
type ListResponse = HonoResponseOf<ListEndpoint, 200>
type UserRole = ListResponse['data'][number]
type AssignRequest = HonoRequestOf<AssignEndpoint>

const row: UserRole = { id: 'role-1', name: 'Editor', scope: 'section', assigned: true }
const request: AssignRequest = { param: { userId: 'user-1', roleId: 'role-1' } }
// @ts-expect-error the nested user-role route requires its user identity.
const missingUserId: AssignRequest = { param: { roleId: 'role-1' } }
void [row, request, missingUserId]
