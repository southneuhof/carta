import { defineSectionSchema } from '@southneuhof/landing-section-schema/defineSectionSchema'

export default defineSectionSchema({
  code: 'product-showcase',
  info: {
    name: 'Product Showcase',
    description: 'Single product detail by product id',
  },
  editor: {
    group: 'Product',
  },
  meta: {
    fields: ['product_id'] as const,
    defaultValues: {
      product_id: null,
    },
    editor: {
      fieldsAlias: {
        product_id: 'Product',
      },
      fieldsType: {
        product_id: { type: 'text' },
      },
    },
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
      editor: {
        fieldAliases: {
          id: 'ID',
          name: 'Name',
          description: 'Description',
          url: 'URL',
          category: 'Category',
          thumbnail: 'Thumbnail',
          images: 'Images',
          product_category_id: 'Product Category',
        },
        fieldsType: {
          description: { type: 'html' },
          images: { type: 'array' },
        },
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
