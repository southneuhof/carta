import schema from '@southneuhof/landing-section-schema/sections/hero-banner-two'
import { defineSectionEditorOverlay } from './types'

export default defineSectionEditorOverlay(schema, {
  group: 'Banner',
  meta: {
    inputConfig: {
      logo: { type: 'image' },
    },
    fieldsAlias: {
      logo: 'Logo',
    },
  },
  slots: {
    banner: {
      label: 'Banner Items',
      fields: ['media_type', 'media', 'subtitle', 'title', 'description'],
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
      },
    },
  },
})
