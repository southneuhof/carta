import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'
import { languageOptions } from './_helpers'

const productTranslationModel: ModelConfig = withModelDefaults({
  name: 'productTranslation',
  title: 'Terjemahan Produk',
  modelAPI: 'productTranslation',
  fields: ['product_id', 'language', 'name', 'slug', 'description'],
  fieldsAlias: {
    product_id: 'Produk',
  },
  transaction: {
    fields: ['language', 'name', 'slug', 'description'],
    inputConfig: {
      language: { type: 'radio', props: { data: languageOptions, required: true } },
      name: { type: 'text', props: { required: true } },
      slug: { type: 'text' },
      description: { type: 'rich-text' },
    },
  },
})

export default productTranslationModel
