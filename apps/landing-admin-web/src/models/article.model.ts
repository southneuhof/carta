import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const articleModel: ModelConfig = withModelDefaults({
  name: 'article',
  title: 'Artikel',
  modelAPI: 'article',
  fields: ['id', 'created_at', 'updated_at', 'categories', 'translations'],
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
      fields: ['id', 'created_at', 'updated_at', 'categories', 'translations'],
    },
  },
  transaction: {
    fields: ['categories', 'created_at'],
    inputConfig: {
      categories: { type: 'tag' },
      created_at: { type: 'date' },
    },
  },
})

export default articleModel
