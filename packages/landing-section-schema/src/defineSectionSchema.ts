import type {
  SectionSchema,
  SectionSchemaMeta,
} from '@southneuhof/landing-sveltekit-framework/types'
import { commonSectionMetaConfig } from './common-section-meta.js'

const COMMON_META_FIELDS = [...commonSectionMetaConfig.fields]

function hasOwn(target: object, key: string) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

function throwOnCommonMetaDuplicate(
  meta: SectionSchemaMeta | undefined,
  location: string,
) {
  const duplicates = new Set<string>()

  for (const key of COMMON_META_FIELDS) {
    if (meta?.fields?.includes(key)) duplicates.add(key)
    if (meta?.defaultValues && hasOwn(meta.defaultValues, key)) duplicates.add(key)
    if (meta?.editor?.inputConfig && hasOwn(meta.editor.inputConfig, key)) duplicates.add(key)
    if (meta?.editor?.fieldsAlias && hasOwn(meta.editor.fieldsAlias, key)) duplicates.add(key)
  }

  if (duplicates.size > 0) {
    throw new Error(
      `[landing-section-schema] Duplicate common meta field(s) "${Array.from(duplicates).join(', ')}" in ${location}. ` +
      'Define them only in common-section-meta.ts.',
    )
  }
}

function mergeCommonMeta(
  localMeta: SectionSchemaMeta | undefined,
  location: string,
): SectionSchemaMeta {
  throwOnCommonMetaDuplicate(localMeta, location)

  return {
    ...localMeta,
    fields: [...COMMON_META_FIELDS, ...(localMeta?.fields ?? [])],
    defaultValues: {
      ...commonSectionMetaConfig.defaultValues,
      ...(localMeta?.defaultValues ?? {}),
    },
    editor: {
      ...commonSectionMetaConfig.editor,
      ...(localMeta?.editor ?? {}),
      inputConfig: {
        ...commonSectionMetaConfig.editor.inputConfig,
        ...(localMeta?.editor?.inputConfig ?? {}),
      },
      fieldsAlias: {
        ...commonSectionMetaConfig.editor.fieldsAlias,
        ...(localMeta?.editor?.fieldsAlias ?? {}),
      },
      getInitialData: localMeta?.editor?.getInitialData,
    },
  }
}

export function defineSectionSchema<const TSchema extends SectionSchema>(schema: TSchema): TSchema {
  return {
    ...schema,
    meta: mergeCommonMeta(schema.meta, `schema.meta (${schema.code})`),
  } as TSchema
}
