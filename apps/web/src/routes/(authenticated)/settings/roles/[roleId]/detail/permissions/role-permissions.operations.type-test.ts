import type { HonoRequestOf, HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'

type ListEndpoint = (typeof rpc.roles)[':roleId']['permissions']['$get']
type AssignEndpoint = (typeof rpc.roles)[':roleId']['permissions'][':permissionId']['$put']
type ListResponse = HonoResponseOf<ListEndpoint, 200>
type Permission = ListResponse['data'][number]
type AssignRequest = HonoRequestOf<AssignEndpoint>

const row: Permission = { id: 'permission-1', permissionCode: 'manage-roles', name: 'Manage roles', assigned: true }
const request: AssignRequest = { param: { roleId: 'role-1', permissionId: 'permission-1' } }
void [row, request]
