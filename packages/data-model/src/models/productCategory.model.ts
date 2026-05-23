import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const productCategoryModel: ModelConfig = withModelDefaults({
  name: 'productCategory',
  title: 'Kategori Produk',
  modelAPI: 'productCategory',
  fields: ['name', 'order', 'active', 'created_at', 'updated_at', 'translations'],
  view: {
    list: {
      searchParameters: { sort_by: 'order', sort: 'asc' },
      draggable: true,
    },
  },
  transaction: {
    fields: ['name', 'active'],
  },
})

export default productCategoryModel
