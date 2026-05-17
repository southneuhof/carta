import type { InputConfig } from '@southneuhof/is-data-model'

type SectionSchemaSlotType = 'content' | 'gallery' | 'section' | 'sectionGroup'
type SectionSchemaSlot = {
  type: SectionSchemaSlotType
  order: number
  many?: boolean
}
type SectionSchema = {
  code: string
  meta?: {
    fields?: readonly string[]
  }
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
  slots?: Partial<Record<SchemaSlotKey<TSchema>, {
    label?: string
    fields?: string[]
    fieldAliases?: Record<string, string>
    inputConfig?: InputConfig
    customEditorKey?: string
  }>>
}

export function defineSectionEditorOverlay<const TSchema extends SectionSchema>(
  schema: TSchema,
  overlay: SectionEditorOverlay<TSchema>,
) {
  return { code: schema.code, schema, overlay } as const
}
