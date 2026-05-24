import { defineSectionSchema } from '@southneuhof/landing-section-schema'

export default defineSectionSchema({
  code: 'general-banner',
  info: {
    name: 'General Banner',
    description: 'General banner with background image and left-aligned text',
  },
  editor: {
    group: 'Banner',
  },
  meta: {
    fields: ['add_overlay'] as const,
    defaultValues: {
      add_overlay: false,
    },
    editor: {
      inputConfig: {
        add_overlay: { type: 'checkbox' },
      },
      fieldsAlias: {
        add_overlay: 'Gunakan Overlay Gelap',
      },
    },
  },
  data: {
    contents: {
      type: 'content',
      order: 1,
      many: true,
      fields: ['media', 'title', 'description'] as const,
      editor: {
        label: 'Daftar Konten',
        inputConfig: {
          media: { type: 'image' },
          title: { type: 'text' },
          description: { type: 'rich-text' },
        },
        fieldsAlias: {
          media: 'Gambar Background',
        },
      },
    },
  },
})
