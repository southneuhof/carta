import { defineSectionSchema } from '@southneuhof/landing-section-schema/defineSectionSchema'

export default defineSectionSchema({
  code: 'gallery-tree',
  info: {
    name: 'Gallery Tree',
    description: 'Two-level sidebar gallery with content details',
  },
  editor: {
    group: 'Content',
  },
  meta: {
    fields: [] as const,
    defaultValues: {},
    editor: {
      fieldsAlias: {},
      fieldsType: {},
    },
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description'] as const,
      editor: {
        label: 'Header Content',
        fieldAliases: {
          subtitle: 'Subtitle',
          title: 'Title',
          description: 'Description',
        },
        fieldsType: {
          description: { type: 'html' },
        },
        inputConfig: {
          subtitle: { type: 'text' },
          title: { type: 'text' },
          description: { type: 'rich-text' },
        },
      },
    },
    sectionGroup: {
      type: 'sectionGroup',
      order: 2,
      many: true,
      schema: {
        info: {
          name: 'Gallery Group',
          description: 'First-level collapsible sidebar group',
        },
        meta: {
          fields: [] as const,
          defaultValues: {},
          editor: {
            fieldsAlias: {},
            fieldsType: {},
          },
        },
        data: {
          sectionGroup: {
            type: 'sectionGroup',
            order: 1,
            many: true,
            schema: {
              info: {
                name: 'Gallery Item',
                description: 'Leaf gallery item with content and images',
              },
              meta: {
                fields: [] as const,
                defaultValues: {},
                editor: {
                  fieldsAlias: {},
                  fieldsType: {},
                },
              },
              data: {
                content: {
                  type: 'content',
                  order: 1,
                  fields: ['subtitle', 'title', 'description'] as const,
                  editor: {
                    label: 'Content',
                    fieldAliases: {
                      subtitle: 'Subtitle',
                      title: 'Title',
                      description: 'Description',
                    },
                    fieldsType: {
                      description: { type: 'html' },
                    },
                    inputConfig: {
                      subtitle: { type: 'text' },
                      title: { type: 'text' },
                      description: { type: 'rich-text' },
                    },
                  },
                },
                gallery: {
                  type: 'gallery',
                  order: 2,
                  many: true,
                  fields: ['media', 'title', 'subtitle'] as const,
                  editor: {
                    label: 'Gallery',
                    fieldAliases: {
                      media: 'Image',
                      title: 'Title',
                      subtitle: 'Subtitle',
                    },
                    inputConfig: {
                      media: { type: 'image' },
                      title: { type: 'text' },
                      subtitle: { type: 'text' },
                    },
                  },
                },
              },
            },
            editor: {
              label: 'Leaf Items',
            },
          },
        },
      },
      editor: {
        label: 'Section Groups',
      },
    },
  },
})
