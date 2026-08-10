import { createHonoResourceOperations, parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import type { z } from 'zod/v4'
import { createReportSchema, updateReportSchema, actionSchemas, type ActionName } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.schemas'
import { qhssePtsEntity } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export type Pts = z.output<typeof qhssePtsEntity.schemas.select> & {
  project?: { id: string; name: string }
  division?: { id: string; name: string }
  projectName?: string
  divisionName?: string
  rootCauses?: Array<{ id: string; code: string; name: string }>
  activity?: Array<Record<string, unknown>>
  projectVendors?: Array<{ id: string; name: string }>
  availableActions?: ActionName[]
}
export type PtsCreate = z.input<typeof createReportSchema>
export type PtsUpdate = z.input<typeof updateReportSchema>
export type PtsQuery = { divisionId?: string; projectId?: string; statusCode?: string; stepCode?: string; criteriaCode?: string; search?: string }
type PtsLookupEndpoint = (typeof rpc)['qhsse-pts']['lookups']['$get']
export type PtsLookups = HonoResponseOf<PtsLookupEndpoint, 200>['data']

const transport = createHonoResourceOperations(rpc['qhsse-pts'], dataAdapter)
export const ptsOperations = defineResourceOperations<Pts, PtsQuery, PtsCreate, PtsUpdate>()({
  list: transport.list,
  detail: transport.detail,
  create: transport.create,
  update: transport.update,
  delete: transport.delete,
})

export async function submitPtsAction(id: string, action: ActionName, input: z.input<(typeof actionSchemas)[ActionName]>) {
  const response = await rpc['qhsse-pts'].action[':id'].actions[':action'].$post({ param: { id, action }, json: input })
  const body = await response.json()
  if (!response.ok) throw body
  return body
}

export async function loadPtsLookups(query: { projectId?: string } = {}) {
  return (await parseHonoResponse<PtsLookupEndpoint>(await rpc['qhsse-pts'].lookups.$get({ query }))).data
}
