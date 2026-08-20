import type { CollectionLoadContext, CollectionResult, RecordIdentity } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions, parseHonoResponse } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type {
  LearningMaterialAttachment,
  LearningMaterialCreate,
  LearningMaterialQuestion,
  LearningMaterialQuestionInput,
  LearningMaterialQuestionUpdate,
  LearningMaterialUpdate,
} from './learning-materials.schema'

const api = createHonoResourceActions(rpc['learning-materials'], dataAdapter)

function query(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
}

export const learningMaterialActions = {
  list: api.list,
  detail: api.detail,
  create: (input: LearningMaterialCreate) => api.create(input),
  update: (id: RecordIdentity, input: LearningMaterialUpdate) => api.update(id, input),
  delete: api.delete,
  async attachments({
    materialId,
    query: listQuery,
    searchParameters,
    signal,
  }: CollectionLoadContext<Record<string, unknown>> & { materialId: string }): Promise<CollectionResult<LearningMaterialAttachment>> {
    const endpoint = rpc['learning-materials'][':id'].attachments.list.$get
    const response = await endpoint({ param: { id: materialId }, query: query({ ...searchParameters, ...listQuery }) as never }, { init: { signal } })
    return dataAdapter.normalizeCollection(await parseHonoResponse<typeof endpoint>(response)) as CollectionResult<LearningMaterialAttachment>
  },
  async createAttachment(materialId: string, input: Record<string, unknown>) {
    const endpoint = rpc['learning-materials'][':id'].attachments.create.$post
    return (await parseHonoResponse<typeof endpoint>(await endpoint({ param: { id: materialId }, json: input as never }))).data as LearningMaterialAttachment
  },
  async updateAttachment(materialId: string, attachmentId: string, input: Record<string, unknown>) {
    const endpoint = rpc['learning-materials'][':id'].attachments[':attachmentId'].update.$patch
    return (await parseHonoResponse<typeof endpoint>(await endpoint({ param: { id: materialId, attachmentId }, json: input as never }))).data as LearningMaterialAttachment
  },
  async deleteAttachment(materialId: string, attachmentId: string) {
    const endpoint = rpc['learning-materials'][':id'].attachments[':attachmentId'].delete.$delete
    return parseHonoResponse<typeof endpoint>(await endpoint({ param: { id: materialId, attachmentId } }))
  },
  async questions({ materialId }: { materialId: string }): Promise<CollectionResult<LearningMaterialQuestion>> {
    const endpoint = rpc['learning-materials'][':id'].questions.list.$get
    return dataAdapter.normalizeCollection(await parseHonoResponse<typeof endpoint>(await endpoint({ param: { id: materialId } }))) as CollectionResult<LearningMaterialQuestion>
  },
  async createQuestion(materialId: string, input: LearningMaterialQuestionInput) {
    const endpoint = rpc['learning-materials'][':id'].questions.create.$post
    return (await parseHonoResponse<typeof endpoint>(await endpoint({ param: { id: materialId }, json: input }))).data as LearningMaterialQuestion
  },
  async updateQuestion(materialId: string, questionId: string, input: LearningMaterialQuestionUpdate) {
    const endpoint = rpc['learning-materials'][':id'].questions[':questionId'].update.$patch
    return (await parseHonoResponse<typeof endpoint>(await endpoint({ param: { id: materialId, questionId }, json: input }))).data as LearningMaterialQuestion
  },
  async deleteQuestion(materialId: string, questionId: string) {
    const endpoint = rpc['learning-materials'][':id'].questions[':questionId'].delete.$delete
    return parseHonoResponse<typeof endpoint>(await endpoint({ param: { id: materialId, questionId } }))
  },
}
