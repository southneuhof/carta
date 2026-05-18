import heroBanner from '@southneuhof/landing-section-schema/sections/hero-banner'
import { defineAsyncComponent } from 'vue'
import { defineSectionEditorOverlay } from './types'

export default defineSectionEditorOverlay(heroBanner, {
  group: 'Banner',
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
    quickAccess: {
      label: 'Quick Access Items',
      fields: ['media', 'title', 'description', 'url'],
      inputConfig: {
        media: { type: 'icon-select' },
        url: { type: 'menu-item' },
      },
    },
    projectCategory: {
      label: 'Project Category Items',
      component: defineAsyncComponent(() =>
        import('@/views/authenticated/website/website/_layouts/detail/_layouts/_layouts/_layouts/_Custom/ContentGalleryGalleryEditor.vue')
      ),
    },
  },
})
