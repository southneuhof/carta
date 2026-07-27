import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import type { ResourceRecordOf, ResourceUpdateOf } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

export const userOperations = createHonoResourceOperations(rpc.users)
export type User = ResourceRecordOf<typeof userOperations>
export type UserUpdate = ResourceUpdateOf<typeof userOperations>
