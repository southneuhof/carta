import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions } from './_helpers'

const productCategoryTranslationModel: ModelConfig = withModelDefaults({
  name: 'productCategoryTranslation',
  title: 'Terjemahan Kategori Produk',
  modelAPI: 'productCategoryTranslation',
  fields: ['product_category_id', 'language', 'name', 'description'],
  fieldsAlias: {
    product_category_id: 'Kategori',
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

export default productCategoryTranslationModel
