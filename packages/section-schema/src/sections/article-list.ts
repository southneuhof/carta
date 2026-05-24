import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'article-list',
  info: {
    name: 'Article List',
    description: 'Article listing with search, category filters, and pagination',
  },
  editor: {
    group: 'Article',
  },
  meta: {
    fields: [
      'type',
      'allow_filter',
      'allow_select_all',
      'filter_style',
      'filter_type',
      'article_categories_filter',
      'article_categories_main',
    ] as const,
    defaultValues: {
      type: 'three-column',
      allow_filter: true,
      allow_select_all: true,
      filter_style: 'tab',
      filter_type: 'multi',
      article_categories_filter: [],
      article_categories_main: [],
    },
    editor: {
      inputConfig: {
        type: {
          type: 'select',
          props: {
            data: [
              { id: 'three-column', name: 'Three Column' },
              { id: 'one-column', name: 'One Column' },
            ],
            clearable: false,
          },
        },
        allow_filter: {
          type: 'checkbox',
        },
        allow_select_all: {
          type: 'checkbox',
          dependency: {
            fields: ['allow_filter'],
            visibility: {
              validator: ({ allow_filter }: any) => Boolean(allow_filter),
              default: false,
            },
          },
        },
        filter_style: {
          type: 'select',
          dependency: {
            fields: ['allow_filter'],
            visibility: {
              validator: ({ allow_filter }: any) => Boolean(allow_filter),
              default: false,
            },
          },
          props: {
            data: [
              { id: 'tab', name: 'Tab' },
              { id: 'chip', name: 'Chip' },
            ],
            clearable: false,
          },
        },
        filter_type: {
          type: 'select',
          dependency: {
            fields: ['allow_filter'],
            visibility: {
              validator: ({ allow_filter }: any) => Boolean(allow_filter),
              default: false,
            },
          },
          props: {
            data: [
              { id: 'single', name: 'Single Select' },
              { id: 'multi', name: 'Multi Select' },
            ],
            clearable: false,
          },
        },
        article_categories_filter: {
          type: 'select',
          props: {
            getAPI: 'articleCategory',
            multi: true,
            clearable: true,
          },
        },
        article_categories_main: {
          type: 'select',
          props: {
            getAPI: 'articleCategory',
            multi: true,
            clearable: true,
          },
        },
      },
      fieldsAlias: {
        type: 'Layout Type',
        allow_filter: 'Enable Category Filter',
        allow_select_all: 'Allow Select All',
        filter_style: 'Filter Style',
        filter_type: 'Filter Selection Type',
        article_categories_filter: 'Filter Categories',
        article_categories_main: 'Main Categories',
      },
    },
  },
  data: {
    articleCategory: {
      type: 'resource',
      source: 'article-category',
      order: 1,
      many: true,
      fields: ['id', 'name'] as const,
      params: {
        strategy: 'localizedList',
      },
    },
  },
})
