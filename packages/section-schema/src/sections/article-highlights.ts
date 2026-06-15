import { defineSectionSchema } from '@southneuhof/landing-section-schema/defineSectionSchema'

export default defineSectionSchema({
  code: 'article-highlights',
  info: {
    name: 'Article Highlights',
    description: 'Highlighted list of latest published articles',
  },
  editor: {
    group: 'Article',
  },
  meta: {
    fields: ['articleCategory'] as const,
    defaultValues: {
      articleCategory: null,
    },
    editor: {
      inputConfig: {
        articleCategory: {
          type: 'select',
          props: {
            getAPI: 'articleCategory',
            multi: true,
            clearable: true,
          },
        },
      },
      fieldsAlias: {
        articleCategory: 'Article Category',
      },
    },
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description', 'url', 'url_text'] as const,
      fieldSets: {
        editor: {
          fields: ['subtitle', 'title', 'description', 'url'] as const,
        },
      },
      editor: {
        label: 'Content',
        resolveConfig: () => ({
          fieldSet: 'editor',
        }),
        inputConfig: {
          url: {
            type: 'button-config',
            bind: {
              buttonUrl: 'url',
              buttonText: 'url_text',
            },
            props: {
              textField: 'url_text',
              urlInputConfig: { type: 'text' },
            },
          },
        },
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
    articles: {
      type: 'resource',
      source: 'article',
      order: 2,
      many: true,
      fields: ['id', 'created_at', 'title', 'slug', 'excerpt', 'thumbnail', 'categories'] as const,
      params: {
        strategy: 'latestPublished',
        limit: 4,
        categoryMetaField: 'articleCategory',
        categoryMatch: 'any',
      },
      editor: {
        fieldAliases: {
          id: 'ID',
          created_at: 'Created At',
          title: 'Title',
          slug: 'Slug',
          excerpt: 'Excerpt',
          thumbnail: 'Thumbnail',
          categories: 'Categories',
        },
        fieldsType: {
          excerpt: { type: 'html' },
          categories: { type: 'array' },
        },
      },
    },
  },
})
