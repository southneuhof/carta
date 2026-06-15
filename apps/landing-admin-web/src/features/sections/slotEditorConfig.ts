import type { InputConfig } from '@southneuhof/is-data-model'

export type ContentSlotEditorConfig = {
  fields?: string[]
  fieldSet?: string
  fieldSets?: Record<string, { fields: readonly string[] }>
  // Legacy key kept for backward compatibility with older section schemas.
  fieldsAlias?: Record<string, string>
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
}

export type SlotConfigContext = {
  slot: {
    key: string
    type: 'content' | 'gallery' | 'section' | 'sectionGroup'
    order: number
    many: boolean
  }
  sectionData?: Record<string, any> | null
  parentSectionData?: Record<string, any> | null
  rootSectionData?: Record<string, any> | null
}

export function resolveSlotEditorConfig<TConfig extends ContentSlotEditorConfig>(
  slotConfig: TConfig | undefined,
  ctx: SlotConfigContext,
): TConfig | undefined {
  if (!slotConfig?.resolveConfig) return slotConfig
  const resolved = slotConfig.resolveConfig(ctx)
  const { resolveConfig: _ignoredResolveConfig, ...safeResolved } = resolved ?? {}
  return {
    ...slotConfig,
    ...safeResolved,
    resolveConfig: slotConfig.resolveConfig,
  } as TConfig
}

export function resolveSlotEditorFields(slotConfig: ContentSlotEditorConfig | undefined): string[] {
  if (!slotConfig) return []

  const resolvedFieldSet = slotConfig.fieldSet
  if (resolvedFieldSet && slotConfig.fieldSets?.[resolvedFieldSet]) {
    return [...slotConfig.fieldSets[resolvedFieldSet].fields]
  }

  return slotConfig.fields ? [...slotConfig.fields] : []
}
