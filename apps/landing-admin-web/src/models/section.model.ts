import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { visibleOptions } from './_helpers'

const sectionModel: ModelConfig = withModelDefaults({
  name: 'section',
  title: 'Section',
  modelAPI: 'section',
  fields: ['id', 'name', 'description', 'visible', 'order', 'meta', 'section_type_code', 'updated_at'],
  fieldsAlias: {
    section_type_code: 'Section Type',
    meta: 'Metadata',
  },
  view: {
    list: {
      filter: {
        fields: ['section_type_code', 'visible'],
        inputConfig: {
          visible: { type: 'radio', props: { data: visibleOptions } },
        },
      },
    },
  },
  transaction: {
    fields: ['name', 'description', 'visible', 'meta'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
      visible: { type: 'radio', props: { data: visibleOptions, required: true } },
      meta: { type: 'textarea' },
    },
  },
})

export default sectionModel
