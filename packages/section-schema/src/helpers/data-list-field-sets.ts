import type { SectionSchemaSlot, SectionSchemaSlotEditorResolvedConfig } from '@southneuhof/landing-sveltekit-framework/types'

export const dataListFieldSets = {
  list: {
    fields: ['title', 'description', 'media', 'url', 'status', 'attachment'] as const,
  },
  media: {
    fields: ['subtitle', 'title', 'description', 'media', 'url', 'status', 'attachment'] as const,
  },
  gallery: {
    fields: ['media', 'subtitle', 'title', 'description'] as const,
  },
  content: {
    fields: ['title', 'description'] as const,
  },
  card: {
    fields: ['media', 'attachment', 'subtitle', 'title', 'description', 'url_type', 'url'] as const,
  },
} satisfies NonNullable<SectionSchemaSlot['fieldSets']>

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

const dataListFieldSetResolvedConfigs: Record<string, SectionSchemaSlotEditorResolvedConfig> = {
  list: {
    fieldSet: 'list',
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
    fieldSet: 'media',
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
    fieldSet: 'gallery',
  },
  content: {
    fieldSet: 'content',
    inputConfig: {
      description: { type: 'rich-text' },
    },
  },
  card: {
    fieldSet: 'card',
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

export function resolveDataListFieldSetConfig(type: unknown): SectionSchemaSlotEditorResolvedConfig {
  const key = typeof type === 'string' ? type : 'list'
  return dataListFieldSetResolvedConfigs[key] ?? dataListFieldSetResolvedConfigs.list
}
