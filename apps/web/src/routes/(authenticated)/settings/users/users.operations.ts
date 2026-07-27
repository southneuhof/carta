import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import type { ResourceRecordOf, ResourceUpdateOf } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const userOperations = createHonoResourceOperations(rpc.users, dataAdapter)
export type User = ResourceRecordOf<typeof userOperations>
export type UserUpdate = ResourceUpdateOf<typeof userOperations>
