import { defineSectionSchema } from '@southneuhof/landing-section-schema/defineSectionSchema'

export default defineSectionSchema({
  code: 'product-catalog',
  info: {
    name: 'Product Catalog',
    description: 'Searchable and filterable product catalog preview',
  },
  editor: {
    group: 'Product',
  },
  meta: {
    fields: ['initialLimit', 'showSearch', 'showCategoryTabs'] as const,
    defaultValues: {
      initialLimit: 8,
      showSearch: true,
      showCategoryTabs: true,
    },
    editor: {
      inputConfig: {
        initialLimit: {
          type: 'number',
        },
        showSearch: {
          type: 'checkbox',
        },
        showCategoryTabs: {
          type: 'checkbox',
        },
      },
      fieldsAlias: {
        initialLimit: 'Initial Product Limit',
        showSearch: 'Show Search',
        showCategoryTabs: 'Show Category Tabs',
      },
    },
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description', 'url', 'url_text'] as const,
      editor: {
        label: 'Content',
        fieldAliases: {
          subtitle: 'Subtitle',
          title: 'Title',
          description: 'Description',
          url: 'URL',
          url_text: 'URL Text',
        },
        fieldsType: {
          description: { type: 'html' },
        },
      },
    },
    products: {
      type: 'resource',
      source: 'product',
      order: 2,
      many: true,
      fields: ['id', 'name', 'url', 'thumbnail', 'category', 'product_category_id'] as const,
      params: {
        limit: 8,
      },
      editor: {
        fieldAliases: {
          id: 'ID',
          name: 'Name',
          url: 'URL',
          thumbnail: 'Thumbnail',
          category: 'Category',
          product_category_id: 'Product Category',
        },
      },
    },
  },
})
