import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const jobCategoryModel: ModelConfig = withModelDefaults({
  name: 'jobCategory',
  title: 'Kategori Lowongan',
  modelAPI: 'jobCategory',
  fields: ['name', 'form_type_id', 'order', 'active', 'created_at', 'updated_at', 'translations'],
  fieldsAlias: {
    form_type_id: 'Jenis Formulir',
  },
  view: {
    list: {
      searchParameters: { sort_by: 'order', sort: 'asc' },
      draggable: true,
      filter: {
        fields: ['form_type_id', 'active'],
      },
    },
  },
  transaction: {
    create: {
      fields: ['name', 'form_type_id', 'active'],
    },
    update: {
      fields: ['form_type_id', 'active'],
    },
    inputConfig: {
      form_type_id: { type: 'select', props: { getAPI: 'formType', required: true } },
    },
  },
})

export default jobCategoryModel
