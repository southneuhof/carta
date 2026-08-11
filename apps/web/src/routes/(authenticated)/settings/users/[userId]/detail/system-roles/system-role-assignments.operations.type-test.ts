import type { HonoRequestOf, HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'

type ListEndpoint = (typeof rpc.users)[':userId']['system-role-assignments']['$get']
type AssignEndpoint = (typeof rpc.users)[':userId']['system-role-assignments'][':roleId']['$put']
type ListResponse = HonoResponseOf<ListEndpoint, 200>
type SystemRoleAssignment = ListResponse['data'][number]
type AssignRequest = HonoRequestOf<AssignEndpoint>

const row: SystemRoleAssignment = { id: 'role-1', roleCode: 'editor', name: 'Editor', description: null, active: true, assigned: true }
const request: AssignRequest = { param: { userId: 'user-1', roleId: 'role-1' } }
void [row, request]
