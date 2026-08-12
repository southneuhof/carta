import type {
  FieldDefinition,
  FieldRead,
  FieldReference,
  WebResourceCreateOf,
  WebResourceRecordOf,
  WebResourceSchemaBoundary,
  WebResourceUpdateOf,
} from '../contracts'

type IsAny<T> = 0 extends (1 & T) ? true : false
type KeysOf<T> = IsAny<T> extends true
  ? string
  : [T] extends [object]
    ? [T] extends [Record<string, never>] ? never : Extract<keyof T, string>
    : never
type ObjectPart<T> = [T] extends [object] ? T : Record<string, never>
type RecordPart<TSchema> = ObjectPart<WebResourceRecordOf<TSchema>>
type CreatePart<TSchema> = ObjectPart<WebResourceCreateOf<TSchema>>
type UpdatePart<TSchema> = ObjectPart<WebResourceUpdateOf<TSchema>>
type RecordKeys<TSchema> = KeysOf<WebResourceRecordOf<TSchema>>
type CreateKeys<TSchema> = KeysOf<WebResourceCreateOf<TSchema>>
type UpdateKeys<TSchema> = KeysOf<WebResourceUpdateOf<TSchema>>
type SchemaFieldKey<TSchema> = RecordKeys<TSchema> | CreateKeys<TSchema> | UpdateKeys<TSchema>

type DraftForKey<TSchema, TKey extends string> =
  | (TKey extends CreateKeys<TSchema> ? CreatePart<TSchema> : never)
  | (TKey extends UpdateKeys<TSchema> ? UpdatePart<TSchema> : never)

type ValueOf<T, TKey extends string> = [T] extends [object]
  ? TKey extends keyof T ? T[TKey] : never
  : never

type ValueForKey<TSchema, TKey extends string> = [
  ValueOf<WebResourceRecordOf<TSchema>, TKey>
  | ValueOf<WebResourceCreateOf<TSchema>, TKey>
  | ValueOf<WebResourceUpdateOf<TSchema>, TKey>
] extends [never]
  ? unknown
  : ValueOf<WebResourceRecordOf<TSchema>, TKey>
    | ValueOf<WebResourceCreateOf<TSchema>, TKey>
    | ValueOf<WebResourceUpdateOf<TSchema>, TKey>

type DefinitionForKey<TSchema, TKey extends string> = Omit<
  FieldDefinition<RecordPart<TSchema>, DraftForKey<TSchema, TKey>, ValueForKey<TSchema, TKey>>,
  'read'
> & { read?: FieldRead<RecordPart<TSchema>, unknown> }

type ComputedDefinition<TSchema> = Omit<FieldDefinition<RecordPart<TSchema>, never, unknown>, 'write' | 'form'> & {
  read: FieldRead<RecordPart<TSchema>, unknown>
  form?: false
}

type FieldReferences<TSchema, TDefinitions> = {
  [TKey in keyof TDefinitions]: TKey extends string
    ? FieldReference<TSchema, TKey, TKey extends SchemaFieldKey<TSchema> ? DefinitionForKey<TSchema, TKey> : ComputedDefinition<TSchema>>
    : never
}

type AnyFieldDefinition = FieldDefinition<any, any, any>

interface FieldReferenceState {
  schema: unknown
  key: string
  definition: AnyFieldDefinition
}

const fieldReferenceState = Symbol('is-vue-framework.field-reference')

type StoredFieldReference = {
  readonly key: string
  readonly [fieldReferenceState]: FieldReferenceState
  readonly override?: (partialDefinition: AnyFieldDefinition) => StoredFieldReference
}

export interface FieldReferenceData {
  readonly schema: unknown
  readonly key: string
  readonly definition: AnyFieldDefinition
}

function cloneProjection<T extends object>(projection: T): T {
  const clone = { ...projection } as T & { props?: Record<string, unknown>; behavior?: Record<string, unknown> }
  if (clone.props) clone.props = { ...clone.props }
  if (clone.behavior) clone.behavior = { ...clone.behavior }
  return clone
}

function cloneDefinition(definition: AnyFieldDefinition): AnyFieldDefinition {
  const cloneSurface = <T extends object>(projection: T | false | undefined): T | false | undefined =>
    projection === false || projection === undefined ? projection : cloneProjection(projection)

  return {
    ...definition,
    display: definition.display ? cloneProjection(definition.display) : definition.display,
    table: cloneSurface(definition.table),
    detail: cloneSurface(definition.detail),
    form: cloneSurface(definition.form),
  }
}

function mergeDefinedProperties(
  base: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...(base ?? {}) }
  for (const [key, value] of Object.entries(patch)) if (value !== undefined) result[key] = value
  return result
}

function mergeProjection<T extends object>(
  base: T | false | undefined,
  patch: T | false | undefined,
): T | false | undefined {
  if (patch === undefined) return cloneSurface(base)
  if (patch === false) return false
  if (base === false || base === undefined) return cloneProjection(patch)

  const baseWithOptions = base as T & { props?: Record<string, unknown>; behavior?: Record<string, unknown> }
  const patchWithOptions = patch as T & { props?: Record<string, unknown>; behavior?: Record<string, unknown> }
  const result = { ...baseWithOptions } as T & { props?: Record<string, unknown>; behavior?: Record<string, unknown> }
  for (const [key, value] of Object.entries(patchWithOptions)) {
    if (value !== undefined && key !== 'props' && key !== 'behavior') {
      ;(result as Record<string, unknown>)[key] = value
    }
  }
  if (patchWithOptions.props !== undefined) result.props = mergeDefinedProperties(baseWithOptions.props, patchWithOptions.props)
  if (patchWithOptions.behavior !== undefined) result.behavior = mergeDefinedProperties(baseWithOptions.behavior, patchWithOptions.behavior)
  return result
}

function cloneSurface<T extends object>(projection: T | false | undefined): T | false | undefined {
  return projection === false || projection === undefined ? projection : cloneProjection(projection)
}

function mergeDefinition(base: AnyFieldDefinition, patch: AnyFieldDefinition): AnyFieldDefinition {
  const result = cloneDefinition(base)
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (key === 'display' || key === 'table' || key === 'detail' || key === 'form') continue
    ;(result as Record<string, unknown>)[key] = value
  }
  result.display = mergeProjection(base.display, patch.display) as AnyFieldDefinition['display']
  result.table = mergeProjection(base.table, patch.table)
  result.detail = mergeProjection(base.detail, patch.detail)
  result.form = mergeProjection(base.form, patch.form)
  return result
}

function createReference(
  schema: unknown,
  key: string,
  definition: AnyFieldDefinition,
  terminal: boolean,
): StoredFieldReference {
  const state: FieldReferenceState = { schema, key, definition: cloneDefinition(definition) }
  const reference: StoredFieldReference = {
    key,
    [fieldReferenceState]: state,
  }
  const value = terminal
    ? reference
    : { ...reference, override: (patch: AnyFieldDefinition) => createReference(schema, key, mergeDefinition(state.definition, patch), true) }
  return Object.freeze(value) as StoredFieldReference
}

/** Returns internal field data for resource resolution without making it public API. */
export function readFieldReference(value: unknown): FieldReferenceData | undefined {
  if (!value || typeof value !== 'object') return undefined
  const state = (value as Partial<StoredFieldReference>)[fieldReferenceState]
  return state ? state : undefined
}

export function defineFields<
  const TSchema extends WebResourceSchemaBoundary,
  const TDefinitions extends Record<string, unknown>,
>(
  schema: TSchema,
  definitions: TDefinitions & {
    [TKey in keyof TDefinitions]: TKey extends string
      ? TKey extends SchemaFieldKey<TSchema>
        ? DefinitionForKey<TSchema, TKey>
        : ComputedDefinition<TSchema>
      : never
  },
): FieldReferences<TSchema, TDefinitions> {
  return Object.fromEntries(
    Object.entries(definitions).map(([key, definition]) => [key, createReference(schema, key, definition as AnyFieldDefinition, false)]),
  ) as unknown as FieldReferences<TSchema, TDefinitions>
}
