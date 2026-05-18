import type { ContentSlotEditorConfig } from '@/features/sections/slotEditorConfig'

export const dataListGalleryConfigs: Record<string, ContentSlotEditorConfig> = {
  list: {
    fields: ['title', 'description', 'media', 'url', 'url_text', 'status', 'attachment'],
    fieldAliases: {
      status: 'Dokumen Privat (Memerlukan Request)',
    },
    inputConfig: {
      status: { type: 'checkbox' },
      attachment: { type: 'file' },
    },
  },
  media: {
    fields: ['subtitle', 'title', 'description', 'media', 'url', 'url_text', 'status', 'attachment'],
    fieldAliases: {
      status: 'Dokumen Privat (Memerlukan Request)',
    },
    inputConfig: {
      status: { type: 'checkbox' },
      attachment: { type: 'file' },
    },
  },
  gallery: {
    fields: ['media', 'subtitle', 'title', 'description'],
  },
  content: {
    fields: ['title', 'description'],
    inputConfig: {
      description: { type: 'rich-text' },
    },
  },
  card: {
    fields: ['media', 'attachment', 'subtitle', 'title', 'description', 'url_type', 'url', 'url_text'],
    inputConfig: {
      attachment: { type: 'image' },
    },
    fieldAliases: {
      media: 'Gambar Background',
      attachment: 'Logo',
    },
  },
}
