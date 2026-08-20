import type { CollectionLoadContext, CollectionResult } from '@southneuhof/is-vue-framework'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { parseHonoResponse } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { createHonoResourceActions } from '@/framework/hono'
import type { SyllabusCategoryCreate, SyllabusCategoryUpdate } from './syllabus-categories.schema'

const api = createHonoResourceActions(rpc['syllabus-categories'], dataAdapter)
type Mapping = { id: string; syllabusId: string; active: boolean; syllabus?: { id: string; name: string } | null }
type RoleMapping = { id: string; roleId: string; active: boolean; role?: { id: string; name: string } | null }
type MappingListEndpoint = (typeof rpc)['syllabus-categories'][':id']['syllabi']['list']['$get']
type MappingCreateEndpoint = (typeof rpc)['syllabus-categories'][':id']['syllabi']['create']['$post']
type MappingDeleteEndpoint = (typeof rpc)['syllabus-categories'][':id']['syllabi'][':syllabusId']['delete']['$delete']
type RoleListEndpoint = (typeof rpc)['syllabus-categories'][':id']['roles']['list']['$get']
type RoleUpdateEndpoint = (typeof rpc)['syllabus-categories'][':id']['roles'][':roleId']['update']['$put']

function query(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
}

export const syllabusCategoryActions = {
  list: api.list,
  detail: api.detail,
  create: (input: SyllabusCategoryCreate) => api.create(input),
  update: (id: string, input: SyllabusCategoryUpdate) => api.update(id, input),
  delete: api.delete,
  async mappings({ categoryId, query: listQuery, searchParameters, signal }: CollectionLoadContext<Record<string, unknown>> & { categoryId: string }): Promise<CollectionResult<Mapping>> {
    const response = await rpc['syllabus-categories'][':id'].syllabi.list.$get({ param: { id: categoryId }, query: query({ ...searchParameters, ...listQuery }) as never }, { init: { signal } })
    return dataAdapter.normalizeCollection(await parseHonoResponse<MappingListEndpoint>(response)) as CollectionResult<Mapping>
  },
  async addMappings(categoryId: string, syllabusIds: string[]) {
    return (await parseHonoResponse<MappingCreateEndpoint>(await rpc['syllabus-categories'][':id'].syllabi.create.$post({ param: { id: categoryId }, json: { syllabusIds } }))).data
  },
  async removeMapping(categoryId: string, syllabusId: string) {
    return parseHonoResponse<MappingDeleteEndpoint>(await rpc['syllabus-categories'][':id'].syllabi[':syllabusId'].delete.$delete({ param: { id: categoryId, syllabusId } }))
  },
  async roles({ categoryId }: { categoryId: string }): Promise<CollectionResult<RoleMapping>> {
    const response = await rpc['syllabus-categories'][':id'].roles.list.$get({ param: { id: categoryId } })
    return dataAdapter.normalizeCollection(await parseHonoResponse<RoleListEndpoint>(response)) as CollectionResult<RoleMapping>
  },
  async toggleRole(categoryId: string, roleId: string, active: boolean) {
    return (await parseHonoResponse<RoleUpdateEndpoint>(await rpc['syllabus-categories'][':id'].roles[':roleId'].update.$put({ param: { id: categoryId, roleId }, json: { active } }))).data
  },
}
