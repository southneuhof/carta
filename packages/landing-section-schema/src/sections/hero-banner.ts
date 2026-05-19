import { defineSectionSchema } from '../defineSectionSchema'
import { dataListFieldSetFields, dataListFieldSets, resolveDataListFieldSetConfig } from '../helpers/data-list-field-sets'

export default defineSectionSchema({
  code: 'hero-banner',
  info: {
    name: 'Hero Banner',
    description: 'Landing hero with banners and quick links',
  },
  editor: {
    group: 'Banner',
  },
  data: {
    banner: {
      type: 'gallery',
      order: 1,
      many: true,
      fields: ['media_type', 'media', 'subtitle', 'title', 'description'] as const,
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
        },
      },
    },
    quickAccess: {
      type: 'gallery',
      order: 2,
      many: true,
      fields: ['media', 'title', 'description', 'url'] as const,
      editor: {
        label: 'Quick Access Items',
        inputConfig: {
          media: { type: 'icon-select' },
          url: { type: 'menu-item' },
        },
      },
    },
    projectCategory: {
      type: 'gallery',
      order: 3,
      many: true,
      fields: dataListFieldSetFields,
      fieldSets: dataListFieldSets,
      editor: {
        label: 'Project Category Items',
        resolveConfig: ({ parentSectionData }) => resolveDataListFieldSetConfig((parentSectionData as any)?.meta?.type),
      },
    },
  },
})
