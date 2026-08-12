import { createHonoResourceActions, parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { RecordIdentity } from '@southneuhof/is-vue-framework'
import type { PtsCreate, PtsUpdate } from './pts.schema'

const api = createHonoResourceActions(rpc['qhsse-pts'], dataAdapter)
type ActionEndpoint = (typeof rpc)['qhsse-pts']['action'][':id']['actions'][':action']['$post']
type ActionResult = HonoResponseOf<ActionEndpoint, 200>['data']

const divisionOptionsApi = createHonoResourceActions(rpc['qhsse-pts']['create-options'].divisions, dataAdapter)
const categoryOptionsApi = createHonoResourceActions(rpc['qhsse-pts']['create-options']['pts-work-categories'], dataAdapter)
const projectOptionsApi = createHonoResourceActions(rpc['qhsse-pts']['create-options'].projects, dataAdapter)
const rootCauseOptionsApi = createHonoResourceActions(rpc['qhsse-pts']['create-options']['root-causes'], dataAdapter)
const workItemOptionsApi = createHonoResourceActions(rpc['qhsse-pts']['create-options']['work-items'], dataAdapter)
const vendorOptionsApi = createHonoResourceActions(rpc['qhsse-pts']['create-options']['project-vendors'], dataAdapter)
const userOptionsApi = createHonoResourceActions(rpc['qhsse-pts']['create-options']['project-users'], dataAdapter)

export async function runAction(id: RecordIdentity, action: string, input: object): Promise<ActionResult> {
  const response = await rpc['qhsse-pts'].action[':id'].actions[':action'].$post({ param: { id: String(id), action }, json: input })
  return (await parseHonoResponse<ActionEndpoint>(response)).data
}

export const ptsCreateOptionActions = {
  divisions: { list: divisionOptionsApi.list, detail: divisionOptionsApi.detail },
  categories: { list: categoryOptionsApi.list, detail: categoryOptionsApi.detail },
  projects: { list: projectOptionsApi.list, detail: projectOptionsApi.detail },
  rootCauses: { list: rootCauseOptionsApi.list, detail: rootCauseOptionsApi.detail },
  workItems: { list: workItemOptionsApi.list, detail: workItemOptionsApi.detail },
  projectVendors: { list: vendorOptionsApi.list, detail: vendorOptionsApi.detail },
  projectUsers: { list: userOptionsApi.list, detail: userOptionsApi.detail },
}

export const ptsActions = {
  list: api.list,
  detail: api.detail,
  create: (input: PtsCreate) => api.create(input),
  update: (id: RecordIdentity, input: PtsUpdate) => api.update(id, input),
  action: runAction,
  deleteReport: (id: RecordIdentity, deletedReason: string) => runAction(id, 'delete', { deletedReason }),
}
