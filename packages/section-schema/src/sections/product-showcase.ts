import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'product-showcase',
  info: {
    name: 'Product Showcase',
    description: 'Single product detail by product id',
  },
  editor: {
    group: 'Product',
  },
  data: {
    product: {
      type: 'resource',
      source: 'product',
      order: 1,
      many: false,
      fields: ['id', 'name', 'description', 'url', 'category', 'thumbnail', 'images', 'product_category_id'] as const,
      params: {
        strategy: 'detailById',
        idMetaField: 'product_id',
      },
    },
    config: {
      type: 'resource',
      source: 'section-meta-editor',
      order: 2,
      many: false,
      editor: {
        componentToken: 'product-showcase-meta-editor',
      },
    },
  },
})
