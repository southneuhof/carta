import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const productModel: ModelConfig = withModelDefaults({
  name: 'product',
  title: 'Produk',
  modelAPI: 'product',
  fields: ['product_category_id', 'name', 'order', 'active', 'images', 'created_at', 'updated_at', 'translations'],
  fieldsAlias: {
    product_category_id: 'Kategori',
    translations: 'Terjemahan',
  },
  view: {
    list: {
      searchParameters: { sort_by: 'order', sort: 'asc' },
      draggable: true,
      filter: {
        fields: ['product_category_id', 'active'],
      },
    },
  },
  transaction: {
    fields: ['product_category_id', 'name', 'active', 'images'],
    inputConfig: {
      product_category_id: { type: 'select', props: { getAPI: 'productCategory', required: true } },
      images: { type: 'image', props: { multi: true } },
    },
  },
})

export default productModel
