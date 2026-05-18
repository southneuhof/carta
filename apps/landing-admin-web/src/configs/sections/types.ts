import type { InputConfig } from '@southneuhof/is-data-model'
import type { Component } from 'vue'
import type { ContentSlotEditorConfig, SlotConfigContext } from '@/features/sections/slotEditorConfig'

type SectionSchemaSlotType = 'content' | 'gallery' | 'section' | 'sectionGroup'
type SectionSchemaMeta = {
  fields?: readonly string[]
  inputConfig?: Record<string, any>
  fieldsAlias?: Record<string, string>
  defaultValues?: Record<string, unknown>
  getInitialData?: () => Promise<Record<string, unknown>>
}
type NestedSectionSchema = {
  info?: {
    name?: string
    description?: string
  }
  meta?: SectionSchemaMeta
  data: Record<string, SectionSchemaSlot>
}
type SectionSchemaSlot = {
  type: SectionSchemaSlotType
  order: number
  many?: boolean
  schema?: NestedSectionSchema
}
type SectionSchema = {
  code: string
  meta?: SectionSchemaMeta
  data: Record<string, SectionSchemaSlot>
}

type SectionMetaField<TSchema extends SectionSchema> =
  TSchema['meta'] extends { fields?: readonly (infer TField)[] }
    ? TField extends string
      ? TField
      : never
    : never

type SchemaSlotKey<TSchema extends SectionSchema> = Extract<keyof TSchema['data'], string>

export type SectionEditorOverlay<TSchema extends SectionSchema> = {
  group?: string
  meta?: {
    inputConfig?: Partial<Record<SectionMetaField<TSchema>, InputConfig[string]>>
    fieldsAlias?: Partial<Record<SectionMetaField<TSchema>, string>>
    defaultValues?: Partial<Record<SectionMetaField<TSchema>, any>>
    getInitialData?: () => Promise<Record<string, any>>
  }
  slots?: Partial<Record<SchemaSlotKey<TSchema>, SectionEditorSlotOverlay>>
}

export type SectionEditorSlotOverlay = {
  label?: string
  fields?: string[]
  fieldAliases?: Record<string, string>
  inputConfig?: InputConfig
  fieldsDictionary?: Record<string, unknown>
  fieldsParse?: Record<string, unknown>
  fieldsProxy?: Record<string, unknown>
  fieldsType?: Record<string, unknown>
  fieldsUnit?: Record<string, unknown>
  defaultValues?: Record<string, unknown>
  onDragChange?: (event: any) => void
  resolveConfig?: (ctx: SlotConfigContext) => ContentSlotEditorConfig
  component?: Component
  // For section/sectionGroup slots with `schema`, these overlays apply to `schema.data`.
  slots?: Record<string, SectionEditorSlotOverlay>
}

export function defineSectionEditorOverlay<const TSchema extends SectionSchema>(
  schema: TSchema,
  overlay: SectionEditorOverlay<TSchema>,
) {
  return { code: schema.code, schema, overlay } as const
}
