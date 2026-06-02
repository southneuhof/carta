import { evaluateFieldDependencies, type InputConfig } from '@southneuhof/is-data-model'

function hasOwn(object: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function isNullish(value: unknown) {
  return value === null || value === undefined
}

function isMissingHiddenValue(value: unknown) {
  return value === null || value === undefined || value === ''
}

export function mergeSectionMetaWithDefaults(
  defaults: Record<string, unknown> | undefined,
  persisted: Record<string, unknown> | undefined,
) {
  const merged: Record<string, unknown> = { ...(defaults ?? {}) }

  for (const [key, value] of Object.entries(persisted ?? {})) {
    if (!isNullish(value)) {
      merged[key] = value
      continue
    }

    if (!hasOwn(merged, key)) {
      merged[key] = value
    }
  }

  return merged
}

export function normalizeSectionMetaForSubmit(input: {
  meta: Record<string, unknown>
  inputConfig?: InputConfig
  defaultValues?: Record<string, unknown>
}) {
  const normalized = { ...input.meta }
  const dependencies = input.inputConfig ? evaluateFieldDependencies(normalized, input.inputConfig) : {}

  for (const [field, dependency] of Object.entries(dependencies)) {
    if (dependency.visibility?.value !== false) continue
    if (!hasOwn(normalized, field) || !isMissingHiddenValue(normalized[field])) continue
    if (!hasOwn(input.defaultValues ?? {}, field)) continue
    normalized[field] = input.defaultValues?.[field]
  }

  return normalized
}
