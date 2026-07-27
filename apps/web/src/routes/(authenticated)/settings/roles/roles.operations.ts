import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import type { ResourceCreateOf, ResourceRecordOf, ResourceUpdateOf } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

export const roleOperations = createHonoResourceOperations(rpc.roles)
export type Role = ResourceRecordOf<typeof roleOperations>
export type RoleCreate = ResourceCreateOf<typeof roleOperations>
export type RoleUpdate = ResourceUpdateOf<typeof roleOperations>
