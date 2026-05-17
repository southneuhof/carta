import sectionSchemas from '@southneuhof/landing-section-schema'

type SectionSchemaSlotType = 'content' | 'gallery' | 'section' | 'sectionGroup'
type SectionSchemaSlot = {
  type: SectionSchemaSlotType
  order: number
  many?: boolean
}
type SectionSchema = {
  code: string
  info?: {
    name?: string
    description?: string
  }
  data: Record<string, SectionSchemaSlot>
}
type SectionSchemaRegistry = Record<string, SectionSchema>

export const SUPPORTED_SECTION_SCHEMA_CODES = [
  'content-default',
  'content-gallery',
  'data-list',
  'hero-banner',
  'hero-banner-two',
] as const

export type SupportedSectionSchemaCode = (typeof SUPPORTED_SECTION_SCHEMA_CODES)[number]

export type SectionStructureItem = {
  id?: string | number
  type: SectionSchemaSlotType
  order: number
  [key: string]: unknown
}

export type SupportedSectionSlotEditor = {
  key: string
  type: SectionSchemaSlotType
  order: number
  many: boolean
  label: string
  fields: string[]
  fieldAliases?: Record<string, string>
  customEditorKey?: string
}

export type SupportedSectionEditorConfig = {
  code: SupportedSectionSchemaCode
  info: {
    name: string
    description: string
  }
  slots: SupportedSectionSlotEditor[]
}

export type AddSectionOption = {
  code: SupportedSectionSchemaCode
  name: string
  description: string
}

export type UnsupportedSectionViewModel = {
  sectionName: string
  sectionTypeCode: string
  visible: boolean
  updatedAt: string | null
  message: string
}

export type SectionPanelState =
  | { kind: 'supported'; code: SupportedSectionSchemaCode }
  | { kind: 'unsupported'; viewModel: UnsupportedSectionViewModel }

export type MatchedSlot = {
  slotKey: string
  slot: SectionSchemaSlot
  editor: SupportedSectionSlotEditor
  items: SectionStructureItem[]
}

const DEFAULT_CONTENT_FIELDS = [
  'media',
  'media_type',
  'title',
  'subtitle',
  'description',
  'label',
  'content',
  'blurb',
  'url',
  'url_text',
  'url_type',
  'attachment',
  'amount',
  'status',
  'collection',
  'meta',
]

const DEFAULT_GALLERY_FIELDS = ['media', 'media_type', 'title', 'subtitle', 'description', 'url', 'url_text', 'url_type']

const BASE_SLOT_LABELS: Partial<Record<SectionSchemaSlotType, string>> = {
  content: 'Content',
  gallery: 'Gallery',
  sectionGroup: 'Section Group',
  section: 'Section',
}

const LOCAL_SLOT_LABELS: Record<SupportedSectionSchemaCode, Record<string, string>> = {
  'content-default': {
    content: 'Main Content',
  },
  'content-gallery': {
    content: 'Heading Content',
    gallery: 'Gallery Items',
  },
  'data-list': {
    content: 'Header Content',
    childSections: 'Child Sections',
  },
  'hero-banner': {
    banner: 'Banner Items',
    quickAccess: 'Quick Access Items',
    projectCategory: 'Project Category Items',
  },
  'hero-banner-two': {
    banner: 'Banner Items',
  },
}

const CUSTOM_EDITOR_KEYS: Partial<Record<SupportedSectionSchemaCode, Partial<Record<string, string>>>> = {
  'hero-banner': {
    projectCategory: 'hero-banner.projectCategory',
  },
  'data-list': {
    childSections: 'data-list.childSections',
  },
}

const LOCAL_SCHEMA_GROUPS: Record<SupportedSectionSchemaCode, string> = {
  'content-default': 'Elements',
  'content-gallery': 'Elements',
  'data-list': 'Utility',
  'hero-banner': 'Banner',
  'hero-banner-two': 'Banner',
}

function assertSupportedSchema(code: string): asserts code is SupportedSectionSchemaCode {
  if (!(SUPPORTED_SECTION_SCHEMA_CODES as readonly string[]).includes(code)) {
    throw new Error(`Unsupported section schema code: ${code}`)
  }
}

function buildSupportedRegistry(registry: SectionSchemaRegistry): Record<SupportedSectionSchemaCode, SectionSchema> {
  const supported = {} as Record<SupportedSectionSchemaCode, SectionSchema>

  for (const code of SUPPORTED_SECTION_SCHEMA_CODES) {
    const schema = registry[code]
    if (!schema) {
      throw new Error(`Missing required shared section schema: ${code}`)
    }
    supported[code] = schema
  }

  return supported
}

function getDefaultFields(slotType: SectionSchemaSlotType): string[] {
  if (slotType === 'content') return DEFAULT_CONTENT_FIELDS
  if (slotType === 'gallery') return DEFAULT_GALLERY_FIELDS
  if (slotType === 'sectionGroup') return []
  return []
}

function toSlotEditor(code: SupportedSectionSchemaCode, slotKey: string, slot: SectionSchemaSlot): SupportedSectionSlotEditor {
  return {
    key: slotKey,
    type: slot.type,
    order: slot.order,
    many: Boolean(slot.many),
    label: LOCAL_SLOT_LABELS[code][slotKey] ?? BASE_SLOT_LABELS[slot.type] ?? slotKey,
    fields: getDefaultFields(slot.type),
    customEditorKey: CUSTOM_EDITOR_KEYS[code]?.[slotKey],
  }
}

export const supportedSectionSchemas = buildSupportedRegistry(sectionSchemas as SectionSchemaRegistry)

export function getSupportedSectionSchemaCodes(): SupportedSectionSchemaCode[] {
  return [...SUPPORTED_SECTION_SCHEMA_CODES]
}

export function getAddSectionOptions(): AddSectionOption[] {
  return SUPPORTED_SECTION_SCHEMA_CODES.map((code) => {
    const schema = supportedSectionSchemas[code]
    return {
      code,
      name: schema.info?.name ?? code,
      description: schema.info?.description ?? '',
    }
  })
}

export function getSupportedSectionSchemaGroup(code: SupportedSectionSchemaCode): string {
  return LOCAL_SCHEMA_GROUPS[code]
}

export function getSupportedEditorConfig(code: string): SupportedSectionEditorConfig | null {
  if (!isSupportedSectionType(code)) return null

  const schema = supportedSectionSchemas[code]
  const slots = (Object.entries(schema.data) as Array<[string, SectionSchemaSlot]>)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slotKey, slot]) => toSlotEditor(code, slotKey, slot))

  return {
    code,
    info: {
      name: schema.info?.name ?? code,
      description: schema.info?.description ?? '',
    },
    slots,
  }
}

export function isSupportedSectionType(code: string | null | undefined): code is SupportedSectionSchemaCode {
  return Boolean(code && (SUPPORTED_SECTION_SCHEMA_CODES as readonly string[]).includes(code))
}

export function getSectionPanelState(section: {
  name?: string | null
  section_type_code?: string | null
  visible?: boolean | null
  updated_at?: string | null
}): SectionPanelState {
  if (isSupportedSectionType(section.section_type_code)) {
    return { kind: 'supported', code: section.section_type_code }
  }

  return {
    kind: 'unsupported',
    viewModel: {
      sectionName: section.name || 'Untitled Section',
      sectionTypeCode: section.section_type_code || 'unknown',
      visible: Boolean(section.visible),
      updatedAt: section.updated_at ?? null,
      message: 'This section type is not supported by this admin version and is read-only.',
    },
  }
}

export function buildCreateSectionPayload(input: {
  schemaCode: string
  sectionGroupId: string
  pageTranslationId?: string
}) {
  assertSupportedSchema(input.schemaCode)

  const schema = supportedSectionSchemas[input.schemaCode]

  return {
    section_group_id: input.sectionGroupId,
    page_translation_id: input.pageTranslationId,
    section_type_code: schema.code,
    name: schema.info?.name ?? schema.code,
    config: schema,
  }
}

export function matchSchemaSlotsToStructure(schemaCode: string, structure: SectionStructureItem[]): MatchedSlot[] {
  if (!isSupportedSectionType(schemaCode)) return []

  const schema = supportedSectionSchemas[schemaCode]
  return (Object.entries(schema.data) as Array<[string, SectionSchemaSlot]>)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slotKey, slot]) => {
      const editor = toSlotEditor(schemaCode, slotKey, slot)
      const matches = structure
        .filter((item) => item.type === slot.type && item.order === slot.order)
        .sort((a, b) => a.order - b.order)

      return {
        slotKey,
        slot,
        editor,
        items: slot.many ? matches : matches.slice(0, 1),
      }
    })
}
