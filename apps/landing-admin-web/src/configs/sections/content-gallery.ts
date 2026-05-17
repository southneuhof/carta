import { defineSectionEditorOverlay } from './types'
import contentGallery from '@southneuhof/landing-section-schema/sections/content-gallery'

export default defineSectionEditorOverlay(contentGallery, {
  group: 'Elements',
  meta: {
    inputConfig: {
      remove_margin: { type: 'checkbox' },
      gallery_media_type: {
        type: 'radio',
        props: {
          defaultValue: 'image',
          data: [
            { id: 'image', name: 'Foto' },
            { id: 'embed', name: 'Embed' },
            { id: 'icon', name: 'Icon' },
          ],
        },
      },
      content_align: {
        type: 'select',
        props: {
          data: [
            { id: 'left', name: 'Kiri' },
            { id: 'center', name: 'Tengah' },
            { id: 'right', name: 'Kanan' },
          ],
          clearable: false,
        },
      },
      url_justify: {
        type: 'select',
        props: {
          data: [
            { id: 'left', name: 'Kiri' },
            { id: 'center', name: 'Tengah' },
            { id: 'right', name: 'Kanan' },
          ],
          clearable: false,
        },
      },
      layout_direction: {
        type: 'select',
        props: {
          data: [
            { id: 'vertical', name: 'Vertikal' },
            { id: 'horizontal', name: 'Horizontal' },
          ],
          clearable: false,
        },
      },
      width_preset: {
        type: 'select',
        props: {
          data: [
            { id: 'sm', name: 'Small (max. width 640px)' },
            { id: 'md', name: 'Medium (max. width 768px)' },
            { id: 'lg', name: 'Large (max. width 1024px)' },
            { id: 'xl', name: 'Extra Large (max. width 1280px)' },
          ],
          clearable: false,
        },
      },
      content_order: {
        type: 'select',
        props: {
          data: [
            { id: 'image-text', name: 'Icon -> Teks' },
            { id: 'text-image', name: 'Teks -> Icon' },
          ],
          clearable: false,
        },
      },
      button_type: {
        type: 'select',
        props: {
          data: [
            { id: 'text', name: 'Text' },
            { id: 'button', name: 'Button' },
          ],
          clearable: false,
        },
      },
    },
    fieldsAlias: {
      remove_margin: 'Hilangkan margin pada konten',
      gallery_media_type: 'Tipe Media',
      content_align: 'Align Konten',
      url_justify: 'Justify URL',
      layout_direction: 'Arah Layout',
      width_preset: 'Lebar Konten',
      content_order: 'Urutan Konten',
      button_type: 'Tipe Tombol',
    },
    defaultValues: {
      content_align: 'center',
      button_type: 'button',
      url_justify: 'left',
      width_preset: 'md',
      content_order: 'text-image',
      layout_direction: 'vertical',
      gallery_media_type: 'image',
    },
  },
  slots: {
    content: {
      label: 'Heading Content',
      fields: ['subtitle', 'title', 'description', 'url', 'url_text'],
      inputConfig: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        description: { type: 'rich-text' },
        url: { type: 'menu-item' },
      },
    },
    gallery: {
      label: 'Gallery Items',
      fields: ['media', 'title', 'subtitle'],
      inputConfig: {
        media: {
          type: 'image',
          dependency: {
            fields: ['meta'],
            inputConfig: {
              generator: ({ meta }: any) => ({
                type: meta?.gallery_media_type === 'embed'
                  ? 'embed'
                  : meta?.gallery_media_type === 'icon'
                    ? 'icon-select'
                    : 'image',
              }),
              default: { type: 'image' },
            },
          },
        },
        title: {
          type: 'text',
          dependency: {
            fields: ['meta'],
            visibility: {
              validator: ({ meta }: any) => meta?.gallery_media_type === 'icon',
              default: false,
            },
          },
        },
        subtitle: {
          type: 'text',
          dependency: {
            fields: ['meta'],
            visibility: {
              validator: ({ meta }: any) => meta?.gallery_media_type === 'icon',
              default: false,
            },
          },
        },
      },
    },
  },
})
