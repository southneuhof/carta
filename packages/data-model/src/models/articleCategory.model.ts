import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const articleCategoryModel: ModelConfig = withModelDefaults({
  name: 'articleCategory',
  title: 'Kategori Artikel',
  modelAPI: 'articleCategory',
  fields: ['name', 'created_at', 'updated_at'],
  transaction: {
    fields: ['name']
  }
})

export default articleCategoryModel
