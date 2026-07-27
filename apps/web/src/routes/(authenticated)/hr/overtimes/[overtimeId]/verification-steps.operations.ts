import { parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import type { CollectionResult } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

type StepsEndpoint = (typeof rpc.overtimes)['steps'][':id']['$get']
type StepsResponse = HonoResponseOf<StepsEndpoint, 200>
export type VerificationStep = StepsResponse['data'][number]
export type VerificationStatus = VerificationStep['statusCode']

export async function loadVerificationSteps(id: string): Promise<CollectionResult<VerificationStep>> {
  if (!id) return { data: [] }
  const payload = await parseHonoResponse<StepsEndpoint>(await rpc.overtimes.steps[':id'].$get({ param: { id } }))
  return { data: payload.data, meta: { total: payload.total } }
}
