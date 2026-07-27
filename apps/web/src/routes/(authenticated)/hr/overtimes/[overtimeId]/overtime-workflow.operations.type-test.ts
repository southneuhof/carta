import type { HonoRequestOf, HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { rpc } from '@/framework/rpc'

type SubmitEndpoint = (typeof rpc.overtimes)['submit'][':id']['$post']
type VerifyEndpoint = (typeof rpc.overtimes)['verify'][':id']['$post']
type SubmitResponse = HonoResponseOf<SubmitEndpoint, 200>
type VerifyRequest = HonoRequestOf<VerifyEndpoint>

declare const submit: SubmitResponse['data']
const verify: VerifyRequest = { param: { id: 'overtime-1' }, json: { decision: 'approved' } }
const submittedStatus: SubmitResponse['data']['statusCode'] = 'waiting'
// @ts-expect-error workflow endpoints require the overtime path parameter.
const missingId: VerifyRequest = { json: { decision: 'approved' } }
// @ts-expect-error the verification decision is an exact two-value union.
const invalidDecision: VerifyRequest = { param: { id: 'overtime-1' }, json: { decision: 'waiting' } }
// @ts-expect-error workflow records retain the exact overtime status union.
const invalidSubmittedStatus: SubmitResponse['data']['statusCode'] = 'cancelled'
void [submit, verify, submittedStatus, missingId, invalidDecision, invalidSubmittedStatus]
