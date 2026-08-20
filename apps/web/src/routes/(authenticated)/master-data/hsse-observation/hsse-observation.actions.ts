import type { RecordIdentity } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { FindingCategoryCreate, FindingCategoryUpdate, FindingCauseCreate, FindingCauseUpdate } from './hsse-observation.schema'

const criteriaApi = createHonoResourceActions(rpc['finding-criteria'], dataAdapter)
const typeApi = createHonoResourceActions(rpc['finding-types'], dataAdapter)
const categoryApi = createHonoResourceActions(rpc['finding-categories'], dataAdapter)
const causeApi = createHonoResourceActions(rpc['finding-cause'], dataAdapter)

export const findingCriteriaActions = criteriaApi
export const findingTypeActions = typeApi

export const findingCategoryActions = {
  list: (findingTypeId: string) => (context: Parameters<typeof categoryApi.list>[0]) => categoryApi.list({ ...context, searchParameters: { ...context.searchParameters, findingTypeId } }),
  detail: categoryApi.detail,
  create: (findingTypeId: string) => (input: FindingCategoryCreate) => categoryApi.create({ ...input, findingTypeId }),
  update: (findingTypeId: string) => (id: RecordIdentity, input: FindingCategoryUpdate) => categoryApi.update(id, { ...input, findingTypeId } as FindingCategoryUpdate),
  delete: categoryApi.delete,
}

export const findingCauseActions = {
  list: (findingCategoryId: string) => (context: Parameters<typeof causeApi.list>[0]) => causeApi.list({ ...context, searchParameters: { ...context.searchParameters, findingCategoryId } }),
  detail: causeApi.detail,
  create: (findingCategoryId: string) => (input: FindingCauseCreate) => causeApi.create({ ...input, findingCategoryId }),
  update: (findingCategoryId: string) => (id: RecordIdentity, input: FindingCauseUpdate) => causeApi.update(id, { ...input, findingCategoryId } as FindingCauseUpdate),
  delete: causeApi.delete,
}
