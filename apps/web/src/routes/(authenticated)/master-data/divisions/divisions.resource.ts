import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { division } from '@southneuhof/api/routes/divisions/divisions.entity'
import { businessCategories } from '../business-categories/business-categories.resource'
import { divisionOperations, type Division, type DivisionCreate, type DivisionUpdate } from './divisions.operations'

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

export const divisions = defineResource({
  key: 'divisions',
  fields: defineFields<Division, DivisionCreate>()({
    code: { table: { sortable: true } },
    name: {},
    businessCategoryId: { label: 'Business Category', form: { renderer: 'lookup', source: businessCategories, props: { pick: 'id', view: 'name', required: true } } },
    businessCategory: { label: 'Business Category', read: (record: unknown) => relationName(record, 'businessCategory') },
    imgThumbnail: { label: 'Logo', read: (record: unknown) => record && typeof record === 'object' ? (record as Record<string, unknown>).imgThumbnail : undefined, display: { renderer: 'file' }, form: { renderer: 'image', props: { limit: 1 } }, write: (draft: Record<string, unknown>, value: unknown) => { const file = value as { path?: unknown }; draft.imgThumbnail = typeof file?.path === 'string' ? file.path : value } },
  }),
  table: { fields: ['businessCategory', 'code', 'name', 'imgThumbnail'] },
  detail: { fields: ['businessCategory', 'code', 'name', 'imgThumbnail'] },
  form: { fields: ['businessCategoryId', 'code', 'name', 'imgThumbnail'] },
  schemas: { create: fromZod<DivisionCreate>(division.schemas.create), update: fromZod<DivisionUpdate>(division.schemas.update) },
  capabilities: {
    list: { handler: divisionOperations.list, permission: 'view-divisions', to: { name: 'master-data-divisions' } },
    create: { handler: divisionOperations.create, permission: 'manage-divisions', to: { name: 'master-data-divisions-create' } },
    detail: { handler: divisionOperations.detail, permission: 'view-divisions', to: { name: 'master-data-divisions-detail', params: (id: string) => ({ divisionId: id }) } },
    update: { handler: divisionOperations.update, permission: 'manage-divisions', to: { name: 'master-data-divisions-edit', params: (id: string) => ({ divisionId: id }) } },
    delete: { handler: divisionOperations.delete, permission: 'manage-divisions' },
  },
})
