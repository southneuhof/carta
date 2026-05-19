import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const articleModel: ModelConfig = withModelDefaults({
  name: 'article',
  title: 'Artikel',
  modelAPI: 'article',
  fields: ['created_at', 'updated_at', 'categories', 'translations'],
  fieldsAlias: {
    categories: 'Categories',
    translations: 'Translations',
  },
  view: {
    list: {
      filter: {
        fields: ['categories'],
      },
    },
    detail: {
      fields: ['created_at', 'updated_at', 'categories', 'translations'],
    },
  },
  transaction: {
    fields: ['categories', 'created_at'],
    inputConfig: {
      categories: { type: 'select', props: {getAPI: 'articleCategory', multi: true, required : true} },
      created_at: { type: 'date' },
    },
  },
})

export default articleModel
