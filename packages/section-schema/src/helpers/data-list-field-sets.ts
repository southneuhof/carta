import type { SectionSchemaSlotEditorResolvedConfig } from '@southneuhof/landing-sveltekit-framework/types'

export const dataListEditorFields = {
  list: ['title', 'description', 'media', 'url', 'status', 'attachment'] as const,
  media: ['subtitle', 'title', 'description', 'media', 'url', 'status', 'attachment'] as const,
  gallery: ['media', 'subtitle', 'title', 'description'] as const,
  content: ['title', 'description'] as const,
  card: ['media', 'attachment', 'subtitle', 'title', 'description', 'url_type', 'url'] as const,
}

export const dataListFieldSetFields = [
  'title',
  'description',
  'media',
  'url',
  'url_text',
  'status',
  'attachment',
  'subtitle',
  'url_type',
] as const

const dataListEditorResolvedConfigs: Record<string, SectionSchemaSlotEditorResolvedConfig> = {
  list: {
    fields: [...dataListEditorFields.list],
    fieldAliases: {
      status: 'Dokumen Privat (Memerlukan Request)',
    },
    inputConfig: {
      url: {
        type: 'button-config',
        bind: {
          buttonUrl: 'url',
          buttonText: 'url_text',
        },
        props: {
          textField: 'url_text',
        },
      },
      status: { type: 'checkbox' },
      attachment: { type: 'file' },
    },
  },
  media: {
    fields: [...dataListEditorFields.media],
    fieldAliases: {
      status: 'Dokumen Privat (Memerlukan Request)',
    },
    inputConfig: {
      url: {
        type: 'button-config',
        bind: {
          buttonUrl: 'url',
          buttonText: 'url_text',
        },
        props: {
          textField: 'url_text',
        },
      },
      status: { type: 'checkbox' },
      attachment: { type: 'file' },
    },
  },
  gallery: {
    fields: [...dataListEditorFields.gallery],
  },
  content: {
    fields: [...dataListEditorFields.content],
    inputConfig: {
      description: { type: 'rich-text' },
    },
  },
  card: {
    fields: [...dataListEditorFields.card],
    inputConfig: {
      url: {
        type: 'button-config',
        bind: {
          buttonUrl: 'url',
          buttonText: 'url_text',
        },
        props: {
          textField: 'url_text',
        },
      },
      attachment: { type: 'image' },
    },
    fieldAliases: {
      media: 'Gambar Background',
      attachment: 'Logo',
    },
  },
}

export function resolveDataListEditorConfig(type: unknown): SectionSchemaSlotEditorResolvedConfig {
  const key = typeof type === 'string' ? type : 'list'
  return dataListEditorResolvedConfigs[key] ?? dataListEditorResolvedConfigs.list
}
