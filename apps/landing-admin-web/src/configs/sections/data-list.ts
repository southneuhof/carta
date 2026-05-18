import dataList from '@southneuhof/landing-section-schema/sections/data-list'
import { defineSectionEditorOverlay } from './types'
import { dataListGalleryConfigs } from './contentClassConfigs'

export default defineSectionEditorOverlay(dataList, {
  group: 'Utility',
  meta: {
    inputConfig: {
      type: {
        type: 'select',
        props: {
          required: true,
          data: [
            { id: 'list', name: 'List' },
            { id: 'gallery', name: 'Gallery' },
            { id: 'content', name: 'Content' },
            { id: 'card', name: 'Card' },
            { id: 'media', name: 'Media' },
          ],
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
      hide_outline: {
        type: 'checkbox',
        dependency: {
          fields: ['type'],
          visibility: {
            validator: ({ type }: any) => type === 'media',
            default: false,
          },
        },
      },
      media_aspect_ratio: {
        type: 'select',
        dependency: {
          fields: ['type'],
          visibility: {
            validator: ({ type }: any) => type === 'media',
            default: false,
          },
        },
        props: {
          data: [
            { id: '2/3', name: '2:3' },
            { id: '3/4', name: '3:4' },
            { id: '1/1', name: '1:1' },
          ],
          clearable: false,
        },
      },
      collapsible: { type: 'checkbox' },
      closed_on_initial: {
        type: 'checkbox',
        dependency: {
          fields: ['collapsible'],
          visibility: {
            validator: ({ collapsible }: any) => Boolean(collapsible),
            default: false,
          },
        },
      },
      searchable: { type: 'checkbox' },
      title: {
        type: 'text',
        dependency: {
          fields: ['searchable'],
          visibility: {
            validator: ({ searchable }: any) => Boolean(searchable),
            default: false,
          },
        },
      },
    },
    fieldsAlias: {
      type: 'Tipe Tampilan',
      width_preset: 'Lebar Konten',
      hide_outline: 'Hilangkan Outline',
      media_aspect_ratio: 'Rasio Gambar',
      collapsible: 'Dapat Diklik untuk Menyembunyikan Isi',
      closed_on_initial: 'Tutup Semua di Awal',
      searchable: 'Aktifkan Kolom Pencarian',
      title: 'Judul',
    },
    defaultValues: {
      type: 'list',
      media_aspect_ratio: '2/3',
      width_preset: 'xl',
    },
  },
  slots: {
    content: {
      label: 'Header Content',
      fields: ['subtitle', 'title', 'description'],
      inputConfig: {
        title: { type: 'text' },
        description: { type: 'rich-text' },
      },
    },
    childSections: {
      label: 'Child Sections',
      slots: {
        gallery: {
          label: 'Data',
          resolveConfig: ({ parentSectionData }) =>
            dataListGalleryConfigs[parentSectionData?.meta?.type ?? 'list'] ?? dataListGalleryConfigs.list,
        },
      },
    },
  },
})
