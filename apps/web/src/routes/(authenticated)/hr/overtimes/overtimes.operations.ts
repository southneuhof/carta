import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import type { ResourceCreateOf, ResourceRecordOf, ResourceUpdateOf } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const overtimeOperations = createHonoResourceOperations(rpc.overtimes, dataAdapter)
export type Overtime = ResourceRecordOf<typeof overtimeOperations>
export type OvertimeCreate = ResourceCreateOf<typeof overtimeOperations>
export type OvertimeUpdate = ResourceUpdateOf<typeof overtimeOperations>
export type OvertimeDraft = Pick<OvertimeCreate, 'date' | 'startTime' | 'estimatedMinutes' | 'description'>
export type OvertimeStatus = Overtime['statusCode']
