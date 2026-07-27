import type { HonoRequestOf, HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'
import type { VerificationStatus, VerificationStep } from './verification-steps.operations'

type StepsEndpoint = (typeof rpc.overtimes)['steps'][':id']['$get']
type StepsRequest = HonoRequestOf<StepsEndpoint>
type StepsResponse = HonoResponseOf<StepsEndpoint, 200>
type IsAny<T> = 0 extends (1 & T) ? true : false
type IsUnknown<T> = unknown extends T ? ([keyof T] extends [never] ? true : false) : false

const responseIsAny: IsAny<StepsResponse> = false
const responseIsKnown: IsUnknown<StepsResponse> = false
const request: StepsRequest = { param: { id: 'overtime-1' } }
const row: VerificationStep = {
  id: 'step-1',
  moduleName: 'overtimes',
  moduleId: 'overtime-1',
  orderNumber: 1,
  verificatorType: 'jobPosition',
  jobPositionId: null,
  recipientEmployeeId: null,
  statusCode: 'waiting',
  verifiedByUserId: null,
  verifiedAt: null,
  verifiedDescription: null,
  createdAt: '',
  updatedAt: '',
}
const response: StepsResponse = { data: [row], total: 1 }
const status: VerificationStatus = 'approved'
// @ts-expect-error the steps endpoint requires the overtime identity.
const missingId: StepsRequest = {}
// @ts-expect-error verification statuses are the exact API status union.
const invalidStatus: VerificationStatus = 'cancelled'
void [responseIsAny, responseIsKnown, request, row, response, status, missingId, invalidStatus]
