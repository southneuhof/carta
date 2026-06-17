import { defineSectionSchema } from '@southneuhof/landing-section-schema/defineSectionSchema'

export default defineSectionSchema({
  code: 'hero-banner',
  info: {
    name: 'Hero Banner',
    description: 'Hero banner section with rotating gallery banners',
  },
  editor: {
    group: 'Banner',
  },
  data: {
    banner: {
      type: 'gallery',
      order: 1,
      many: true,
      fields: [
        'media_type',
        'media',
        'subtitle',
        'title',
        'description',
        'cta',
        'cta_text',
        'url',
        'url_text',
      ] as const,
      editor: {
        label: 'Banner Items',
        fields: ['media_type', 'media', 'subtitle', 'title', 'description', 'cta', 'url'] as const,
        inputConfig: {
          media_type: {
            type: 'radio',
            props: {
              required: true,
              data: [
                { name: 'Image', id: 'image' },
                { name: 'Video', id: 'video' },
              ],
            },
          },
          media: {
            type: 'image',
            dependency: {
              fields: ['media_type'],
              inputConfig: {
                generator: ({ media_type }: any) => ({ type: media_type || 'image' }),
                default: { type: 'image' },
              },
              visibility: {
                validator: ({ media_type }: any) => Boolean(media_type),
                default: false,
              },
            },
            props: {
              required: true,
            },
          },
          cta: {
            type: 'button-config',
            bind: {
              buttonUrl: 'cta',
              buttonText: 'cta_text',
            },
            props: {
              textField: 'cta_text',
              urlInputConfig: { type: 'url' },
            },
          },
          cta_text: {
            type: 'text',
          },
          url: {
            type: 'button-config',
            bind: {
              buttonUrl: 'url',
              buttonText: 'url_text',
            },
            props: {
              textField: 'url_text',
              urlInputConfig: { type: 'url' },
            },
          },
          url_text: {
            type: 'text',
          },
        },
        fieldsAlias: {
          media_type: 'Media Type',
          media: 'Media',
          subtitle: 'Subtitle',
          title: 'Title',
          description: 'Description',
          cta: 'Primary Button',
          cta_text: 'Primary Button Text',
          url: 'Secondary Button',
          url_text: 'Secondary Button Text',
        },
        fieldsType: {
          description: { type: 'html' },
          media: {type: 'image'}
        },
      },
    },
  },
})
