import { defineSectionSchema } from '../defineSectionSchema'

export default defineSectionSchema({
  code: 'hero-banner',
  info: {
    name: 'Hero Banner',
    description: 'Hero banner section with rotating gallery banners',
  },
  editor: {
    group: 'Banner',
  },
  meta: {
    fields: ['logo'] as const,
    editor: {
      inputConfig: {
        logo: { type: 'image' },
      },
      fieldsAlias: {
        logo: 'Logo',
      },
    },
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
        inputConfig: {
          media_type: {
            type: 'radio',
            props: {
              required: true,
              data: [
                { name: 'Gambar', id: 'image' },
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
            type: 'text',
          },
          cta_text: {
            type: 'text',
          },
          url: {
            type: 'text',
          },
          url_text: {
            type: 'text',
          },
        },
        fieldsAlias: {
          cta: 'Primary Button URL',
          cta_text: 'Primary Button Text',
          url: 'Secondary Button URL',
          url_text: 'Secondary Button Text',
        },
      },
    },
  },
})
