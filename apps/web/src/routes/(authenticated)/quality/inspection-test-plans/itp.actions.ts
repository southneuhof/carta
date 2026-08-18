import { createHonoResourceActions, parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { RecordIdentity } from '@southneuhof/is-vue-framework'
import type { ItpCreate, ItpUpdate } from './itp.schema'
import type { InspectionTestPlanTemplate, InspectionTestPlanTreeNode } from '@southneuhof/api/routes/inspection-test-plans/inspection-test-plans.schemas'

const api = createHonoResourceActions(rpc['inspection-test-plans'], dataAdapter)
type TemplateEndpoint = (typeof rpc)['inspection-test-plans']['template']['$get']
type TreeEndpoint = (typeof rpc)['inspection-test-plans']['project'][':projectId']['tree']['$get']

export async function loadItpTemplate(projectId: string): Promise<InspectionTestPlanTemplate> {
  return (await parseHonoResponse<TemplateEndpoint>(await rpc['inspection-test-plans'].template.$get({ query: { projectId } }))).data
}

export async function loadItpTree(projectId: string): Promise<InspectionTestPlanTreeNode[]> {
  return (await parseHonoResponse<TreeEndpoint>(await rpc['inspection-test-plans'].project[':projectId'].tree.$get({ param: { projectId } }))).data
}

export const itpActions = {
  detail: api.detail,
  create: (input: ItpCreate) => api.create(input),
  update: (id: RecordIdentity, input: ItpUpdate) => api.update(id, input),
  delete: api.delete,
  loadTemplate: loadItpTemplate,
  loadTree: loadItpTree,
}

export type ItpMutationResult = HonoResponseOf<(typeof rpc)['inspection-test-plans']['create']['$post'], 201>['data']
