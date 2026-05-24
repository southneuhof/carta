import { defineSectionSchema } from '@southneuhof/landing-section-schema'

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
  },
  data: {
    content: {
      type: 'content',
      order: 1,
      fields: ['subtitle', 'title', 'description'] as const,
      editor: {
        label: 'Header Content',
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
              },
              data: {
                content: {
                  type: 'content',
                  order: 1,
                  fields: ['subtitle', 'title', 'description'] as const,
                  editor: {
                    label: 'Content',
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
