import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const pageModel: ModelConfig = withModelDefaults({
  name: 'page',
  title: 'Page',
  modelAPI: 'page',
  fields: ['id', 'menu_item_id', 'slug'],
  fieldsAlias: {
    menu_item_id: 'Menu Item',
  },
  actions: {
    update: false,
  },
  view: {
    list: {
      fields: ['id', 'menu_item_id', 'slug'],
    },
    detail: {
      fields: ['id', 'menu_item_id', 'slug'],
    },
  },
  transaction: {
    fields: ['menu_item_id'],
    inputConfig: {
      menu_item_id: { type: 'text', props: { required: true } },
    },
  },
})

export default pageModel
