import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions } from './_helpers'

const menuItemTranslationModel: ModelConfig = withModelDefaults({
  name: 'menuItemTranslation',
  title: 'Website Translation',
  modelAPI: 'menuItemTranslation',
  fields: ['menu_item_id', 'language', 'name', 'description', 'media'],
  fieldsAlias: {
    menu_item_id: 'Menu Item',
    media: 'Media',
  },
  view: {
    list: {
      fields: ['language', 'name', 'description'],
      filter: {
        fields: ['language'],
      },
    },
  },
  transaction: {
    fields: ['language', 'name', 'description', 'media'],
    inputConfig: {
      language: { type: 'radio', props: { data: languageOptions, required: true } },
      name: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
      media: { type: 'image' },
    },
  },
})

export default menuItemTranslationModel
