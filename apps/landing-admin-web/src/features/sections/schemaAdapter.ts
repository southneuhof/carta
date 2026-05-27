import sectionSchemas from './manifest'
import { resolveSectionEditorComponent } from './componentRegistry'
import type {
  NestedSectionSchema,
  SectionSchemaMeta,
  SectionSchemaEditorInputConfig,
  SectionSchemaRegistry,
  SectionSchemaSlot,
  SectionSchemaSlotEditor,
  SectionSchemaSlotType,
} from '@southneuhof/landing-sveltekit-framework/types'
import type { ContentSlotEditorConfig, SlotConfigContext } from './slotEditorConfig'
import type { Component } from 'vue'

type SectionSchemaData = Record<string, SectionSchemaSlot>
export type SectionSlotPath = string[]

const sharedSectionSchemas = sectionSchemas as SectionSchemaRegistry

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
  fieldSets?: Record<string, { fields: readonly string[] }>
  inputConfig?: SectionSchemaEditorInputConfig
  // Legacy key kept for backward compatibility with older section schemas.
  fieldsAlias?: Record<string, string>
  fieldAliases?: Record<string, string>
  fieldsDictionary?: Record<string, unknown>
  fieldsParse?: Record<string, unknown>
  fieldsProxy?: Record<string, unknown>
  fieldsType?: Record<string, unknown>
  fieldsUnit?: Record<string, unknown>
  defaultValues?: Record<string, unknown>
  onDragChange?: (event: any) => void
  resolveConfig?: (ctx: SlotConfigContext) => ContentSlotEditorConfig
  component?: Component
  schema?: NestedSectionSchema
}
export type SupportedSectionSlotEditorContext = SupportedSectionSlotEditor & {
  path: SectionSlotPath
  pathKey: string
}
export type SupportedSectionEditorConfig = {
  code: SupportedSectionSchemaCode
  info: { name: string; description: string }
  meta?: {
    fields?: readonly string[]
    defaultValues?: Record<string, unknown>
    inputConfig?: SectionSchemaEditorInputConfig
    fieldsAlias?: Record<string, string>
    fieldsType?: Record<string, unknown>
    getInitialData?: () => Promise<Record<string, unknown>>
  }
  slots: SupportedSectionSlotEditor[]
}
export type AddSectionOption = { code: SupportedSectionSchemaCode; name: string; description: string }
export type UnsupportedSectionViewModel = { sectionName: string; sectionTypeCode: string; visible: boolean; updatedAt: string | null; message: string }
export type SectionPanelState = { kind: 'supported'; code: SupportedSectionSchemaCode } | { kind: 'unsupported'; viewModel: UnsupportedSectionViewModel }
export type MatchedSlot = { slotKey: string; slot: SectionSchemaSlot; editor: SupportedSectionSlotEditor; items: SectionStructureItem[] }
export type MatchedSchemaSlot = {
  slotKey: string
  path: SectionSlotPath
  pathKey: string
  slot: SectionSchemaSlot
  editor: SupportedSectionSlotEditorContext
  items: SectionStructureItem[]
}
export type SupportedSectionMetaConfig = {
  fields?: readonly string[]
  defaultValues?: Record<string, unknown>
  inputConfig?: SectionSchemaEditorInputConfig
  fieldsAlias?: Record<string, string>
  fieldsType?: Record<string, unknown>
  getInitialData?: () => Promise<Record<string, unknown>>
}

const BASE_SLOT_LABELS: Partial<Record<SectionSchemaSlotType, string>> = { content: 'Content', gallery: 'Gallery', sectionGroup: 'Section Group', section: 'Section' }

function assertSupportedSchema(code: string): asserts code is SupportedSectionSchemaCode {
  if (!(SUPPORTED_SECTION_SCHEMA_CODES as readonly string[]).includes(code)) throw new Error(`Unsupported section schema code: ${code}`)
}

function getResolvedFields(slot: SectionSchemaSlot, resolved: ContentSlotEditorConfig | undefined): string[] {
  const resolvedFieldSet = (resolved as { fieldSet?: string } | undefined)?.fieldSet
  if (resolvedFieldSet && slot.fieldSets?.[resolvedFieldSet]) {
    return [...slot.fieldSets[resolvedFieldSet].fields]
  }

  if (resolvedFieldSet && !slot.fieldSets?.[resolvedFieldSet]) {
    const message = `[sections] Unknown fieldSet "${resolvedFieldSet}" for slot`
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      throw new Error(message)
    }
    console.warn(message)
  }

  return slot.fields ? [...slot.fields] : []
}

function toSlotEditorContext(input: {
  slotKey: string
  slot: SectionSchemaSlot
  path: SectionSlotPath
  resolved?: ContentSlotEditorConfig
}): SupportedSectionSlotEditorContext {
  const slotEditor: SectionSchemaSlotEditor | undefined = input.slot.editor
  const resolvedFieldAliases = (input.resolved as any)?.fieldAliases ?? (input.resolved as any)?.fieldsAlias
  const slotFieldAliases = (slotEditor as any)?.fieldAliases ?? (slotEditor as any)?.fieldsAlias
  const fieldAliases = resolvedFieldAliases ?? slotFieldAliases

  return {
    key: input.slotKey,
    type: input.slot.type,
    order: input.slot.order,
    many: Boolean(input.slot.many),
    label: slotEditor?.label ?? BASE_SLOT_LABELS[input.slot.type] ?? input.slotKey,
    fields: getResolvedFields(input.slot, input.resolved),
    fieldSets: input.slot.fieldSets,
    inputConfig: (input.resolved?.inputConfig ?? slotEditor?.inputConfig) as SectionSchemaEditorInputConfig | undefined,
    fieldsAlias: fieldAliases,
    fieldAliases,
    fieldsDictionary: input.resolved?.fieldsDictionary ?? slotEditor?.fieldsDictionary,
    fieldsParse: input.resolved?.fieldsParse ?? slotEditor?.fieldsParse,
    fieldsProxy: input.resolved?.fieldsProxy ?? slotEditor?.fieldsProxy,
    fieldsType: input.resolved?.fieldsType ?? slotEditor?.fieldsType,
    fieldsUnit: input.resolved?.fieldsUnit ?? slotEditor?.fieldsUnit,
    defaultValues: input.resolved?.defaultValues ?? slotEditor?.defaultValues,
    onDragChange: input.resolved?.onDragChange,
    resolveConfig: slotEditor?.resolveConfig as ((ctx: SlotConfigContext) => ContentSlotEditorConfig) | undefined,
    component: resolveSectionEditorComponent(slotEditor?.componentToken),
    schema: input.slot.schema,
    path: input.path,
    pathKey: input.path.join('.'),
  }
}

function toSlotEditor(slotKey: string, slot: SectionSchemaSlot): SupportedSectionSlotEditor {
  const path = [slotKey]
  const editor = toSlotEditorContext({ slotKey, slot, path })
  return {
    key: editor.key,
    type: editor.type,
    order: editor.order,
    many: editor.many,
    label: editor.label,
    fields: editor.fields,
    fieldSets: editor.fieldSets,
    inputConfig: editor.inputConfig,
    fieldsAlias: editor.fieldsAlias,
    fieldAliases: editor.fieldAliases,
    fieldsDictionary: editor.fieldsDictionary,
    fieldsParse: editor.fieldsParse,
    fieldsProxy: editor.fieldsProxy,
    fieldsType: editor.fieldsType,
    fieldsUnit: editor.fieldsUnit,
    defaultValues: editor.defaultValues,
    onDragChange: editor.onDragChange,
    resolveConfig: editor.resolveConfig,
    component: editor.component,
    schema: editor.schema,
  }
}

function toMetaConfig(meta: SectionSchemaMeta | undefined): SupportedSectionMetaConfig {
  return {
    fields: meta?.fields ?? [],
    defaultValues: meta?.defaultValues ?? {},
    inputConfig: meta?.editor?.inputConfig ?? {},
    fieldsAlias: meta?.editor?.fieldsAlias ?? {},
    fieldsType: meta?.editor?.fieldsType ?? {},
    getInitialData: meta?.editor?.getInitialData,
  }
}

export const supportedSectionSchemas = sharedSectionSchemas
export function getSupportedSectionSchemaCodes(): SupportedSectionSchemaCode[] { return [...SUPPORTED_SECTION_SCHEMA_CODES] }
export function getAddSectionOptions(): AddSectionOption[] {
  return SUPPORTED_SECTION_SCHEMA_CODES.map((code) => ({ code, name: supportedSectionSchemas[code].info?.name ?? code, description: supportedSectionSchemas[code].info?.description ?? '' }))
}
export function getSupportedSectionSchemaGroup(code: SupportedSectionSchemaCode): string { return supportedSectionSchemas[code]?.editor?.group ?? 'Other' }

export function getSupportedEditorConfig(code: string): SupportedSectionEditorConfig | null {
  if (!isSupportedSectionType(code)) return null
  const schema = supportedSectionSchemas[code]
  const slots = (Object.entries(schema.data) as Array<[string, SectionSchemaSlot]>).sort(([, a], [, b]) => a.order - b.order).map(([slotKey, slot]) => toSlotEditor(slotKey, slot))
  return {
    code,
    info: { name: schema.info?.name ?? code, description: schema.info?.description ?? '' },
    meta: toMetaConfig(schema.meta),
    slots,
  }
}

export function getNestedEditorConfig(
  schema: NestedSectionSchema | null | undefined,
): SupportedSectionEditorConfig | null {
  if (!schema) return null
  return {
    code: '__nested_schema__',
    info: {
      name: schema.info?.name ?? 'Nested Section',
      description: schema.info?.description ?? '',
    },
    meta: toMetaConfig(schema.meta),
    slots: [],
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

export function buildCreateSectionPayload(input: { schemaCode: string; sectionGroupId: string; pageTranslationId?: string; name?: string; description?: string; meta?: Record<string, unknown> }) {
  assertSupportedSchema(input.schemaCode)
  const schema = supportedSectionSchemas[input.schemaCode]

  const payload: Record<string, unknown> = {
    section_group_id: input.sectionGroupId,
    section_type_code: schema.code,
  }

  if (input.pageTranslationId) payload.page_translation_id = input.pageTranslationId
  if (input.name) payload.name = input.name
  else if (schema.info?.name) payload.name = schema.info.name

  if (input.description) payload.description = input.description
  else if (schema.info?.description) payload.description = schema.info.description

  if (input.meta && Object.keys(input.meta).length > 0) {
    payload.meta = input.meta
  }

  return payload
}

export function buildCreateNestedSectionPayload(input: {
  sectionGroupId: string
  pageTranslationId?: string
  name?: string
  description?: string | null
}) {
  const payload: Record<string, string> = {
    section_group_id: input.sectionGroupId,
  }

  if (input.pageTranslationId) payload.page_translation_id = input.pageTranslationId
  if (input.name) payload.name = input.name
  if (input.description) payload.description = input.description

  return payload
}

export function matchSchemaSlotsToStructure(schemaCode: string, structure: SectionStructureItem[]): MatchedSlot[] {
  return matchRootSchemaSlotsToStructure(schemaCode, structure).map((item) => ({
    slotKey: item.slotKey,
    slot: item.slot,
    editor: item.editor,
    items: item.items,
  }))
}

export function matchSchemaDataToStructure(input: {
  schemaData: SectionSchemaData
  structure: SectionStructureItem[]
  basePath?: SectionSlotPath
}): MatchedSchemaSlot[] {
  return (Object.entries(input.schemaData) as Array<[string, SectionSchemaSlot]>)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slotKey, slot]) => {
      const path = [...(input.basePath ?? []), slotKey]
      const editor = toSlotEditorContext({ slotKey, slot, path })
      const matches = input.structure
        .filter((item) => item.type === slot.type && item.order === slot.order)
        .sort((a, b) => a.order - b.order)

      return {
        slotKey,
        path,
        pathKey: path.join('.'),
        slot,
        editor,
        items: slot.many ? matches : matches.slice(0, 1),
      }
    })
}

export function matchRootSchemaSlotsToStructure(schemaCode: string, structure: SectionStructureItem[]): MatchedSchemaSlot[] {
  if (!isSupportedSectionType(schemaCode)) return []
  const schema = supportedSectionSchemas[schemaCode]
  return matchSchemaDataToStructure({
    schemaData: schema.data,
    structure,
    basePath: [],
  })
}

export function matchNestedSchemaSlotsToStructure(input: {
  parentMatch: MatchedSchemaSlot | SupportedSectionSlotEditorContext
  structure: SectionStructureItem[]
}): MatchedSchemaSlot[] {
  const parentEditor = 'editor' in input.parentMatch ? input.parentMatch.editor : input.parentMatch
  if (!parentEditor.schema) return []

  return matchSchemaDataToStructure({
    schemaData: parentEditor.schema.data,
    structure: input.structure,
    basePath: parentEditor.path,
  })
}
