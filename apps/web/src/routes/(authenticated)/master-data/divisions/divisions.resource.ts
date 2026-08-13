import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { businessCategories } from '../business-categories/business-categories.resource'
import { divisionsActions } from './divisions.actions'
import { divisionsSchema } from './divisions.schema'

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { name?: unknown }).name : undefined
}

const fields = defineFields(divisionsSchema, {
  businessCategory: { label: 'Business Category', read: (record) => relationName(record, 'businessCategory') },
  businessCategoryId: { label: 'Business Category', form: { renderer: 'lookup', source: businessCategories, props: { pick: 'id', view: 'name', required: true } } },
  code: { table: { sortable: true } },
  name: {},
  imgThumbnail: {
    label: 'Logo',
    read: (record) => record.imgThumbnail,
    display: { renderer: 'file' },
    form: { renderer: 'image', props: { limit: 1 } },
    write: (draft, value) => {
      const file = value as { path?: unknown }
      draft.imgThumbnail = typeof file?.path === 'string' ? file.path : value
    },
  },
})

export const divisions = defineResource(divisionsSchema, {
  key: 'divisions',
  actions: {
    list: {
      run: divisionsActions.list,
      fields: [fields.businessCategory, fields.code, fields.name, fields.imgThumbnail],
      permission: 'view-divisions',
      route: { name: 'master-data-divisions' },
    },
    detail: {
      run: divisionsActions.detail,
      fields: [fields.businessCategory, fields.code, fields.name, fields.imgThumbnail],
      permission: 'view-divisions',
      route: { name: 'master-data-divisions-detail', params: (id) => ({ divisionId: String(id) }) },
    },
    create: {
      run: divisionsActions.create,
      fields: [fields.businessCategoryId, fields.code, fields.name, fields.imgThumbnail],
      permission: 'create-divisions',
      route: { name: 'master-data-divisions-create' },
    },
    update: {
      run: divisionsActions.update,
      fields: [fields.businessCategoryId, fields.code, fields.name, fields.imgThumbnail],
      permission: 'update-divisions',
      route: { name: 'master-data-divisions-edit', params: (id) => ({ divisionId: String(id) }) },
    },
    delete: { run: divisionsActions.delete, permission: 'delete-divisions' },
  },
})
