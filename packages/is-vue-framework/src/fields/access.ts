/**
 * Default and exceptional field access.
 *
 * Ordinary fields read and write by catalog key. `read` covers computed or
 * nested display values, `write` covers transformed or multi-property drafts.
 * Both are pure: no navigation, no network, no reads outside the arguments.
 */
import type { FieldContext, FieldDefinition } from '../contracts'

export function readField<TRecord extends object>(
  record: TRecord | undefined | null,
  key: string,
  field: Pick<FieldDefinition<TRecord>, 'read'> | undefined,
  context: FieldContext = {},
): unknown {
  if (record === undefined || record === null) return undefined
  if (field?.read) return field.read(record, context)
  return record[key]
}

/**
 * Returns a new draft rather than mutating the caller's object, so callers may
 * pass frozen or externally owned drafts.
 */
export function writeField<TDraft extends object>(
  draft: TDraft,
  key: string,
  value: unknown,
  field: Pick<FieldDefinition<Record<string, unknown>, TDraft>, 'write'> | undefined,
  context: FieldContext = {},
): TDraft {
  const next = { ...draft } as TDraft
  if (field?.write) {
    field.write(next, value, context)
    return next
  }
  ;(next as Record<string, unknown>)[key] = value
  return next
}

/** Reads every field of a record into a flat, renderer-ready value map. */
export function readFields<TRecord extends object>(
  record: TRecord | undefined | null,
  fields: readonly { key: string; read?: FieldDefinition<TRecord>['read'] }[],
  context: FieldContext = {},
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of fields) values[field.key] = readField(record, field.key, field, context)
  return values
}
