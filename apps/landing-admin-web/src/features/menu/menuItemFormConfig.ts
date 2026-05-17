import { parseSlug } from '@/utils/common'

export const menuItemFormConfig: {
  fields: string[]
  fieldsAlias: Record<string, string>
  inputConfig: Record<string, any>
  getInitialData: () => Promise<Record<string, any>>
} = {
  fields: ['name', 'slug', 'menu_item_type', 'url'],
  fieldsAlias: {
    name: 'Nama',
    slug: 'Slug',
    menu_item_type: 'Tipe Menu',
    url: 'Link/URL',
  },
  inputConfig: {
    name: {
      type: 'text',
      props: { required: true },
    },
    slug: {
      type: 'text',
      dependency: {
        fields: ['name'],
        value: {
          generator: ({ name }: Record<string, any>) => (name ? parseSlug(name) : ''),
          default: '',
        },
      },
      props: {
        required: true,
        disabled: true,
      },
    },
    menu_item_type: {
      type: 'radio',
      props: {
        required: true,
        data: [
          { name: 'Halaman', id: 'page' },
          { name: 'Link/URL', id: 'link' },
        ],
      },
    },
    url: {
      type: 'text',
      dependency: {
        fields: ['menu_item_type'],
        visibility: {
          validator: ({ menu_item_type }: Record<string, any>) => menu_item_type === 'link',
          default: false,
        },
      },
      props: {
        required: true,
      },
    },
  },
  getInitialData: async () => ({
    menu_item_type: 'page',
  }),
}
