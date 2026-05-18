import contentDefault from '@southneuhof/landing-section-schema/sections/content-default'
import { defineSectionEditorOverlay } from './types'

export default defineSectionEditorOverlay(contentDefault, {
  group: 'Elements',
  meta: {
    inputConfig: {
      remove_margin: { type: 'checkbox' },
      remove_outline_on_images: { type: 'checkbox' },
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
            { id: 'image-text', name: 'Media -> Teks' },
            { id: 'text-image', name: 'Teks -> Media' },
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
      remove_outline_on_images: 'Hilangkan outline pada gambar',
      content_align: 'Align Konten',
      url_justify: 'Justify URL',
      layout_direction: 'Arah Layout',
      width_preset: 'Lebar Konten',
      content_order: 'Urutan Konten',
      button_type: 'Tipe Tombol',
    },
    defaultValues: {
      content_align: 'left',
      button_type: 'button',
      url_justify: 'left',
      width_preset: 'md',
      content_order: 'image-text',
      layout_direction: 'vertical',
    },
  },
  slots: {
    content: {
      label: 'Main Content',
      fields: ['media_type', 'media', 'attachment', 'subtitle', 'title', 'description', 'url', 'url_text'],
      inputConfig: {
        media_type: {
          type: 'radio',
          props: {
            defaultValue: 'image',
            data: [
              { name: 'Foto', id: 'image' },
              { name: 'Embed', id: 'embed' },
            ],
          },
        },
        media: {
          type: 'image',
          dependency: {
            fields: ['media_type'],
            inputConfig: {
              generator: ({ media_type }: any) => ({ type: media_type === 'embed' ? 'embed' : 'image' }),
              default: { type: 'image' },
            },
          },
        },
        title: { type: 'text' },
        subtitle: { type: 'text' },
        description: { type: 'rich-text' },
        url: { type: 'menu-item' },
      },
    },
  },
})
