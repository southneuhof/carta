import type { RecordIdentity } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions, parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { PermitApdCreate, PermitApdUpdate } from './permit-apd.schema'

const api = createHonoResourceActions(rpc['permit-apd'], dataAdapter)
type UpdateEndpoint = (typeof rpc)['permit-apd']['update'][':id']['$patch']
type DeleteEndpoint = (typeof rpc)['permit-apd']['delete'][':id']['$delete']

async function scopedUpdate(parentId: string, id: RecordIdentity, input: PermitApdUpdate) {
  const response = await rpc['permit-apd'].update[':id'].$patch({
    param: { id: String(id) },
    query: { permitCategoryApdId: parentId },
    json: input,
  })
  const result = await parseHonoResponse<UpdateEndpoint>(response)
  return dataAdapter.normalizeRecord(result.data) as HonoResponseOf<UpdateEndpoint, 200>['data']
}

async function scopedDelete(parentId: string, id: RecordIdentity) {
  const response = await rpc['permit-apd'].delete[':id'].$delete({
    param: { id: String(id) },
    query: { permitCategoryApdId: parentId },
  })
  return parseHonoResponse<DeleteEndpoint>(response)
}

export const permitApdActions = {
  list: (parentId: string) => (context: Parameters<typeof api.list>[0]) => api.list({ ...context, searchParameters: { ...context.searchParameters, permitCategoryApdId: parentId } }),
  detail: (parentId: string) => (context: Parameters<typeof api.detail>[0]) => api.detail({ ...context, searchParameters: { ...context.searchParameters, permitCategoryApdId: parentId } }),
  create: (parentId: string) => (input: PermitApdCreate) => api.create({ ...input, permitCategoryApdId: parentId }),
  update: (parentId: string) => (id: RecordIdentity, input: PermitApdUpdate) => scopedUpdate(parentId, id, input),
  delete: (parentId: string) => (id: RecordIdentity) => scopedDelete(parentId, id),
}
