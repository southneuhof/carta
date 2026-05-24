import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'gallery-stack-array',
  info: {
    name: 'Gallery Stack Array',
    description: 'Responsive social gallery cards with stacked images',
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
          name: 'Gallery Stack Card',
          description: 'Social profile card with a stacked image gallery',
        },
        meta: {
          fields: [] as const,
          defaultValues: {},
        },
        data: {
          content: {
            type: 'content',
            order: 1,
            fields: ['media', 'title', 'subtitle'] as const,
            editor: {
              label: 'Social Content',
              inputConfig: {
                media: { type: 'image' },
                title: { type: 'text' },
                subtitle: { type: 'text' },
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
        label: 'Gallery Cards',
      },
    },
  },
})
