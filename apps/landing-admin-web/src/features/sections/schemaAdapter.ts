import sectionSchemas from './manifest'
import { sectionEditorOverlays } from '@/configs/sections'
import type { InputConfig } from '@southneuhof/is-data-model'

type SectionSchemaSlotType = 'content' | 'gallery' | 'section' | 'sectionGroup'
type SectionSchemaSlot = { type: SectionSchemaSlotType; order: number; many?: boolean }
type SectionSchemaMeta = {
  fields?: readonly string[]
  inputConfig?: Record<string, any>
  fieldsAlias?: Record<string, string>
  defaultValues?: Record<string, unknown>
  getInitialData?: () => Promise<Record<string, unknown>>
}
type SectionSchema = { code: string; info?: { name?: string; description?: string }; meta?: SectionSchemaMeta; data: Record<string, SectionSchemaSlot> }
type SectionSchemaRegistry = Record<string, SectionSchema>

const sharedSectionSchemas = sectionSchemas as SectionSchemaRegistry
const overlayByCode = Object.fromEntries(sectionEditorOverlays.map((item) => [item.code, item.overlay])) as Record<string, (typeof sectionEditorOverlays)[number]['overlay']>

export const SUPPORTED_SECTION_SCHEMA_CODES = Object.freeze(Object.keys(sharedSectionSchemas).sort())
export type SupportedSectionSchemaCode = string

export type SectionStructureItem = { id?: string | number; type: SectionSchemaSlotType; order: number; [key: string]: unknown }
export type SupportedSectionSlotEditor = {
  key: string
  type: SectionSchemaSlotType
  order: number
  many: boolean
  label: string
  fields: string[]
  inputConfig?: InputConfig
  fieldAliases?: Record<string, string>
  customEditorKey?: string
}
export type SupportedSectionEditorConfig = {
  code: SupportedSectionSchemaCode
  info: { name: string; description: string }
  meta?: SectionSchemaMeta
  slots: SupportedSectionSlotEditor[]
}
export type AddSectionOption = { code: SupportedSectionSchemaCode; name: string; description: string }
export type UnsupportedSectionViewModel = { sectionName: string; sectionTypeCode: string; visible: boolean; updatedAt: string | null; message: string }
export type SectionPanelState = { kind: 'supported'; code: SupportedSectionSchemaCode } | { kind: 'unsupported'; viewModel: UnsupportedSectionViewModel }
export type MatchedSlot = { slotKey: string; slot: SectionSchemaSlot; editor: SupportedSectionSlotEditor; items: SectionStructureItem[] }

const DEFAULT_CONTENT_FIELDS = ['media', 'media_type', 'title', 'subtitle', 'description', 'label', 'content', 'blurb', 'url', 'url_text', 'url_type', 'attachment', 'amount', 'status', 'collection', 'meta']
const DEFAULT_GALLERY_FIELDS = ['media', 'media_type', 'title', 'subtitle', 'description', 'url', 'url_text', 'url_type']
const BASE_SLOT_LABELS: Partial<Record<SectionSchemaSlotType, string>> = { content: 'Content', gallery: 'Gallery', sectionGroup: 'Section Group', section: 'Section' }

function assertSupportedSchema(code: string): asserts code is SupportedSectionSchemaCode {
  if (!(SUPPORTED_SECTION_SCHEMA_CODES as readonly string[]).includes(code)) throw new Error(`Unsupported section schema code: ${code}`)
}

function getDefaultFields(slotType: SectionSchemaSlotType): string[] {
  if (slotType === 'content') return DEFAULT_CONTENT_FIELDS
  if (slotType === 'gallery') return DEFAULT_GALLERY_FIELDS
  return []
}

function toSlotEditor(code: SupportedSectionSchemaCode, slotKey: string, slot: SectionSchemaSlot): SupportedSectionSlotEditor {
  const overlaySlot = overlayByCode[code]?.slots?.[slotKey]
  return {
    key: slotKey,
    type: slot.type,
    order: slot.order,
    many: Boolean(slot.many),
    label: overlaySlot?.label ?? BASE_SLOT_LABELS[slot.type] ?? slotKey,
    fields: overlaySlot?.fields ?? getDefaultFields(slot.type),
    inputConfig: overlaySlot?.inputConfig,
    fieldAliases: overlaySlot?.fieldAliases,
    customEditorKey: overlaySlot?.customEditorKey,
  }
}

export const supportedSectionSchemas = sharedSectionSchemas
export function getSupportedSectionSchemaCodes(): SupportedSectionSchemaCode[] { return [...SUPPORTED_SECTION_SCHEMA_CODES] }
export function getAddSectionOptions(): AddSectionOption[] {
  return SUPPORTED_SECTION_SCHEMA_CODES.map((code) => ({ code, name: supportedSectionSchemas[code].info?.name ?? code, description: supportedSectionSchemas[code].info?.description ?? '' }))
}
export function getSupportedSectionSchemaGroup(code: SupportedSectionSchemaCode): string { return overlayByCode[code]?.group ?? 'Other' }

export function getSupportedEditorConfig(code: string): SupportedSectionEditorConfig | null {
  if (!isSupportedSectionType(code)) return null
  const schema = supportedSectionSchemas[code]
  const overlay = overlayByCode[code]
  const slots = (Object.entries(schema.data) as Array<[string, SectionSchemaSlot]>).sort(([, a], [, b]) => a.order - b.order).map(([slotKey, slot]) => toSlotEditor(code, slotKey, slot))
  return {
    code,
    info: { name: schema.info?.name ?? code, description: schema.info?.description ?? '' },
    meta: {
      fields: schema.meta?.fields ?? [],
      inputConfig: overlay?.meta?.inputConfig ?? {},
      fieldsAlias: overlay?.meta?.fieldsAlias ?? {},
      defaultValues: overlay?.meta?.defaultValues ?? {},
      getInitialData: overlay?.meta?.getInitialData,
    },
    slots,
  }
}

export function isSupportedSectionType(code: string | null | undefined): code is SupportedSectionSchemaCode {
  return Boolean(code && (SUPPORTED_SECTION_SCHEMA_CODES as readonly string[]).includes(code))
}

export function getSectionPanelState(section: { name?: string | null; section_type_code?: string | null; visible?: boolean | null; updated_at?: string | null }): SectionPanelState {
  if (isSupportedSectionType(section.section_type_code)) return { kind: 'supported', code: section.section_type_code }
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

export function buildCreateSectionPayload(input: { schemaCode: string; sectionGroupId: string; pageTranslationId?: string }) {
  assertSupportedSchema(input.schemaCode)
  const editorConfig = getSupportedEditorConfig(input.schemaCode)
  const schema = supportedSectionSchemas[input.schemaCode]
  return {
    section_group_id: input.sectionGroupId,
    page_translation_id: input.pageTranslationId,
    section_type_code: schema.code,
    name: schema.info?.name ?? schema.code,
    description: schema.info?.description ?? '',
    meta: editorConfig?.meta?.defaultValues ?? {},
  }
}

export function matchSchemaSlotsToStructure(schemaCode: string, structure: SectionStructureItem[]): MatchedSlot[] {
  if (!isSupportedSectionType(schemaCode)) return []
  const schema = supportedSectionSchemas[schemaCode]
  return (Object.entries(schema.data) as Array<[string, SectionSchemaSlot]>).sort(([, a], [, b]) => a.order - b.order).map(([slotKey, slot]) => {
    const editor = toSlotEditor(schemaCode, slotKey, slot)
    const matches = structure.filter((item) => item.type === slot.type && item.order === slot.order).sort((a, b) => a.order - b.order)
    return { slotKey, slot, editor, items: slot.many ? matches : matches.slice(0, 1) }
  })
}
