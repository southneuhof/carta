import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions } from './_helpers'

const articleCategoryTranslationModel: ModelConfig = withModelDefaults({
  name: 'articleCategoryTranslation',
  title: 'Terjemahan Kategori Artikel',
  modelAPI: 'articleCategoryTranslation',
  fields: ['id', 'article_category_id', 'language', 'name', 'description'],
  fieldsAlias: {
    article_category_id: 'Category',
  },
  transaction: {
    fields: ['language', 'name', 'description'],
    inputConfig: {
      language: { type: 'radio', props: { data: languageOptions, required: true } },
      name: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
    },
  },
})

export default articleCategoryTranslationModel
