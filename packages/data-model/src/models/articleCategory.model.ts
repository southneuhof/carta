import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const articleCategoryModel: ModelConfig = withModelDefaults({
  name: 'articleCategory',
  title: 'Kategori Artikel',
  modelAPI: 'articleCategory',
  fields: ['translations', 'articles', 'allowedRoles', 'created_at', 'updated_at'],
  fieldsAlias: {
    allowedRoles: 'Allowed Roles',
  },
  view: {
    detail: {
      fields: ['translations', 'allowedRoles', 'created_at', 'updated_at'],
    },
  },
  transaction: {
    fields: ['translations'],
    inputConfig: {
      translations: { type: 'textarea' },
    },
  },
})

export default articleCategoryModel
