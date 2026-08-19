import { createHonoResourceActions, parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { RecordIdentity } from '@southneuhof/is-vue-framework'
import type { QualityInspectionContextOperation } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import type {
  CompleteQualityInspection,
  QualityInspectionCreate,
  QualityInspectionUpdate,
  SubmitQualityInspectionDocumentations,
  VerifyQualityInspection,
  VerifyQualityInspectionWorkItem,
} from './quality-inspection.schema'

const api = createHonoResourceActions(rpc['quality-inspection'], dataAdapter)
type CreateContextEndpoint = (typeof rpc)['quality-inspection']['createContext']['$get']
type SchedulesEndpoint = (typeof rpc)['quality-inspection']['schedules']['list']['$get']
type ScheduleContextEndpoint = (typeof rpc)['quality-inspection']['schedules'][':id']['createContext']['$get']
type CompleteEndpoint = (typeof rpc)['quality-inspection']['actions'][':id']['completeReport']['$post']
type WorkItemVerifyEndpoint = (typeof rpc)['quality-inspection']['actions'][':id']['workItems'][':workItemRowId']['verify']['$post']
type DocumentationEndpoint = (typeof rpc)['quality-inspection']['actions'][':id']['submitDocumentations']['$post']
type VerifyEndpoint = (typeof rpc)['quality-inspection']['actions'][':id']['verify']['$post']

export async function loadCreateContext(projectId: string, operation: QualityInspectionContextOperation) {
  return (await parseHonoResponse<CreateContextEndpoint>(await rpc['quality-inspection'].createContext.$get({ query: { projectId, operation } }))).data
}

export async function loadSchedules() {
  return (await parseHonoResponse<SchedulesEndpoint>(await rpc['quality-inspection'].schedules.list.$get())).data
}

export async function loadScheduleContext(scheduleId: string) {
  return (await parseHonoResponse<ScheduleContextEndpoint>(await rpc['quality-inspection'].schedules[':id'].createContext.$get({ param: { id: scheduleId } }))).data
}

export async function completeReport(id: RecordIdentity, input: CompleteQualityInspection) {
  return (await parseHonoResponse<CompleteEndpoint>(await rpc['quality-inspection'].actions[':id'].completeReport.$post({ param: { id: String(id) }, json: input }))).data
}

export async function verifyWorkItem(id: RecordIdentity, rowId: RecordIdentity, input: VerifyQualityInspectionWorkItem) {
  return (
    await parseHonoResponse<WorkItemVerifyEndpoint>(
      await rpc['quality-inspection'].actions[':id'].workItems[':workItemRowId'].verify.$post({ param: { id: String(id), workItemRowId: String(rowId) }, json: input })
    )
  ).data
}

export async function submitDocumentations(id: RecordIdentity, input: SubmitQualityInspectionDocumentations) {
  return (await parseHonoResponse<DocumentationEndpoint>(await rpc['quality-inspection'].actions[':id'].submitDocumentations.$post({ param: { id: String(id) }, json: input }))).data
}

export async function verifyReport(id: RecordIdentity, input: VerifyQualityInspection) {
  return (await parseHonoResponse<VerifyEndpoint>(await rpc['quality-inspection'].actions[':id'].verify.$post({ param: { id: String(id) }, json: input }))).data
}

export const qualityInspectionActions = {
  list: api.list,
  detail: api.detail,
  create: (input: QualityInspectionCreate) => api.create(input),
  update: (id: RecordIdentity, input: QualityInspectionUpdate) => api.update(id, input),
  delete: api.delete,
  loadCreateContext,
  loadSchedules,
  loadScheduleContext,
  completeReport,
  verifyWorkItem,
  submitDocumentations,
  verifyReport,
}

export type QualityInspectionMutationResult = HonoResponseOf<(typeof rpc)['quality-inspection']['create']['$post'], 201>['data']
