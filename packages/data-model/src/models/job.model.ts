import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const jobModel: ModelConfig = withModelDefaults({
  name: 'job',
  title: 'Lowongan',
  modelAPI: 'job',
  fields: ['job_category_id', 'name', 'order', 'active', 'created_at', 'updated_at', 'translations'],
  fieldsAlias: {
    job_category_id: 'Kategori Lowongan',
    translations: 'Terjemahan',
  },
  view: {
    list: {
      searchParameters: { sort_by: 'order', sort: 'asc' },
      draggable: true,
      filter: {
        fields: ['job_category_id', 'active'],
      },
    },
  },
  transaction: {
    create: {
      fields: ['job_category_id', 'name', 'active'],
    },
    update: {
      fields: ['job_category_id', 'active'],
    },
    inputConfig: {
      job_category_id: { type: 'select', props: { getAPI: 'jobCategory', required: true } },
    },
  },
})

export default jobModel
