import { createHonoResourceActions, parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { RecordIdentity } from '@southneuhof/is-vue-framework'
import type { PtsCreate, PtsUpdate } from './pts.schema'

const api = createHonoResourceActions(rpc['qhsse-pts'], dataAdapter)
type ActionEndpoint = (typeof rpc)['qhsse-pts']['action'][':id']['actions'][':action']['$post']
type ActionResult = HonoResponseOf<ActionEndpoint, 200>['data']

export async function runAction(id: RecordIdentity, action: string, input: object): Promise<ActionResult> {
  const response = await rpc['qhsse-pts'].action[':id'].actions[':action'].$post({ param: { id: String(id), action }, json: input })
  return (await parseHonoResponse<ActionEndpoint>(response)).data
}

export const ptsActions = {
  list: api.list,
  detail: api.detail,
  create: (input: PtsCreate) => api.create(input),
  update: (id: RecordIdentity, input: PtsUpdate) => api.update(id, input),
  action: runAction,
  deleteReport: (id: RecordIdentity, deletedReason: string) => runAction(id, 'delete', { deletedReason }),
}
