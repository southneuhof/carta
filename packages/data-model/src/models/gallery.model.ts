import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const galleryModel: ModelConfig = withModelDefaults({
  name: 'gallery',
  title: 'Gallery',
  modelAPI: 'gallery',
  fields: ['section_id', 'order'],
  view: {
    list: {
      searchParameters: { sort_by: 'order', sort: 'asc' },
      draggable: true,
    },
  },
  transaction: {
    fields: ['section_id'],
    inputConfig: {
      section_id: { type: 'text' },
    },
  },
})

export default galleryModel
