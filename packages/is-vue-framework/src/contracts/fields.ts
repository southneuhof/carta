/**
 * Shared field catalog contracts.
 *
 * One catalog replaces the legacy parallel maps (`fieldsAlias`, `fieldsType`,
 * `fieldsProxy`, `fieldsParse`, ...). Shared properties apply on every surface;
 * `table`, `detail`, and `form` carry surface-specific behavior.
 *
 * `renderer` is the field-config key for widget selection on every surface.
 * "Control(s)" is reserved for action controls and never appears here.
 *
 * Plan 002 builds the catalog and renderer registry on top of these contracts.
 */

export type FieldKey<TRecord> = Extract<keyof TRecord, string> | (string & {})

/** Caller-supplied information a field may read besides the record or draft. */
export type FieldContext = Record<string, unknown>

/** Ordinary fields need no accessor; `read`/`write` are escape hatches. */
export type FieldRead<TRecord, TValue = unknown> = (record: TRecord, context: FieldContext) => TValue
export type FieldWrite<TDraft, TValue = unknown> = (draft: TDraft, value: TValue, context: FieldContext) => void

/** Identity of the field a renderer is rendering. */
export interface FieldRendererInfo {
  key: string
  label?: string
}

/** Context passed to display renderers on table and detail surfaces. */
export interface DisplayRendererContext<TRecord = Record<string, unknown>, TValue = unknown> {
  value: TValue
  record: TRecord
  field: FieldRendererInfo
  index?: number
}

/** Context passed to form renderers. */
export interface FormRendererContext<TDraft = Record<string, unknown>, TValue = unknown> {
  value: TValue
  draft: TDraft
  field: FieldRendererInfo
  setValue: (value: TValue) => void
  error?: string
  touched: boolean
  disabled: boolean
  validating: boolean
  formValidating: boolean
}

/**
 * Context handed to every `behavior` function. Reading a draft property inside
 * a behavior function is what subscribes that function to the property; there
 * is no manual depends-on list.
 */
export interface FieldBehaviorContext<TDraft = Record<string, unknown>, TValue = unknown> {
  draft: TDraft
  value: TValue
  context: FieldContext
}

/**
 * Pure, synchronous behavior options over the reactive draft. Constants belong
 * in the static projection — `behavior` accepts only functions.
 *
 * Behavior decides presence, schemas decide validity: a field whose `visible`
 * evaluates false contributes no value to the submitted draft, and validation
 * runs on the visibility-filtered draft.
 */
export interface FieldBehavior<TDraft = Record<string, unknown>, TValue = unknown> {
  visible?: (context: FieldBehaviorContext<TDraft, TValue>) => boolean
  disabled?: (context: FieldBehaviorContext<TDraft, TValue>) => boolean
  /** Shallow-merges over the static `props` of the same projection. */
  props?: (context: FieldBehaviorContext<TDraft, TValue>) => Record<string, unknown>
  /** Atomically changes presentation only; identity, accessors, and validation stay static. */
  presentation?: (context: FieldBehaviorContext<TDraft, TValue>) => FieldBehaviorPresentation
  derived?: (context: FieldBehaviorContext<TDraft, TValue>) => TValue
  /** Identity is compared with `Object.is`; changed identity clears this field. */
  resetWhen?: (context: FieldBehaviorContext<TDraft, TValue>) => unknown
}

export interface FieldBehaviorPresentation {
  renderer?: string | null
  label?: string | null
  props?: Record<string, unknown> | null
  span?: number | null
}

/** Widget selection shared by every surface projection. */
export interface FieldRendererSelection {
  renderer?: string
  props?: Record<string, unknown>
}

export interface FieldDisplayProjection extends FieldRendererSelection {
  format?: string
}

export interface FieldTableProjection extends FieldDisplayProjection {
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  class?: string
  headerClass?: string
}

export interface FieldDetailProjection extends FieldDisplayProjection {
  emphasis?: 'strong' | 'muted'
  span?: number
}

export interface FieldFormProjection<TDraft = Record<string, unknown>, TValue = unknown> extends FieldRendererSelection {
  /** Opaque app-owned authoring data; resolved before renderer invocation. */
  source?: unknown
  behavior?: FieldBehavior<TDraft, TValue>
  span?: number
}

export interface FieldDefinition<
  TRecord = Record<string, unknown>,
  TDraft = TRecord,
  TValue = unknown,
> {
  label?: string
  read?: FieldRead<TRecord, TValue>
  write?: FieldWrite<TDraft, TValue>
  display?: FieldDisplayProjection
  /** `false` excludes the field from that surface entirely. */
  table?: FieldTableProjection | false
  detail?: FieldDetailProjection | false
  form?: FieldFormProjection<TDraft, TValue> | false
}

export type FieldCatalog<TRecord = Record<string, unknown>, TDraft = TRecord> = Record<
  string,
  FieldDefinition<TRecord, TDraft>
>

/** A catalog entry paired with the key it was registered under. */
export type ResolvedField<TRecord = Record<string, unknown>, TDraft = TRecord> = FieldDefinition<TRecord, TDraft> & {
  key: string
}

/**
 * What a core component accepts as `fields`: an ordered list of resolved fields
 * (what resource prop factories produce) or a catalog object (ad-hoc usage).
 */
export type FieldsInput<TRecord = Record<string, unknown>, TDraft = TRecord> =
  | readonly ResolvedField<TRecord, TDraft>[]
  | FieldCatalog<TRecord, TDraft>

/** Selection of catalog keys used by resource surface definitions. */
export type FieldSelection<TRecord = Record<string, unknown>> = readonly FieldKey<TRecord>[]
