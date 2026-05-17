import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const sectionGroupModel: ModelConfig = withModelDefaults({
  name: 'sectionGroup',
  title: 'Section Group',
  modelAPI: 'sectionGroup',
  fields: ['id', 'page_translation_id'],
  view: {
    list: {
      fields: ['id', 'page_translation_id'],
    },
    detail: {
      fields: ['id', 'page_translation_id'],
    },
  },
  transaction: {
    fields: ['page_translation_id'],
    inputConfig: {
      page_translation_id: { type: 'text' },
    },
  },
})

export default sectionGroupModel
