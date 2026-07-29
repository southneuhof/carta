import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import type { ResourceRecordOf } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const tollSectionOperations = createHonoResourceOperations(rpc['toll-sections'], dataAdapter)
export const applicantOperations = createHonoResourceOperations(rpc.overtimes.applicants, dataAdapter)
export const jobPositionOperations = createHonoResourceOperations(rpc['job-positions'], dataAdapter)

export type TollSection = ResourceRecordOf<typeof tollSectionOperations>
export type Applicant = ResourceRecordOf<typeof applicantOperations>
export type JobPosition = ResourceRecordOf<typeof jobPositionOperations>
