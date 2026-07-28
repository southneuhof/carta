/**
 * Core component prop contracts.
 *
 * `Table`, `Detail`, and `Form` are resource-agnostic: they own data and field
 * orchestration only. Cards, headings, toolbars, and page actions belong
 * to the view shells (plan 005). Form owns draft state, rendering, validation,
 * and submission — it never learns whether it creates or updates.
 *
 * Plan 004 implements the components against exactly these props.
 *
 * `data` and `load` are alternatives: `data` means the caller controls the
 * data, `load` means the component owns loading. Supplying both is a
 * development error reported at runtime.
 */

import type { CollectionLoadContext, Load, RecordIdentity, RecordLoadContext, MaybePromise } from './load'
import type { FieldsInput } from './fields'
import type { CollectionResult, RecordResult } from './results'
import type { QueryNamespace, QueryValues } from './query'
import type { SubmitError, ValidationSchema } from './validation'

export interface TableProps<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
> {
  fields: FieldsInput<TRecord>
  data?: TRecord[]
  load?: Load<CollectionLoadContext<TQuery>, CollectionResult<TRecord>>
  /** Extra loader arguments, including parent scoping supplied by the route. */
  searchParameters?: Record<string, unknown>
  /** URL namespace for this table's query; required when a resource appears twice in one view. */
  namespace?: QueryNamespace
  /** URL/user collection controls. When supplied, replaces namespaced URL ownership. */
  query?: TQuery
  /** `always` keeps disabled controls visible for a single known page. */
  pagination?: 'auto' | 'always' | false
  /** Allowed page sizes; invalid values are ignored and the active size stays available. */
  pageSizeOptions?: readonly number[]
  /** Default limit when query does not supply one. */
  defaultPageSize?: number
  /** Minimum resizable width in pixels. */
  minColumnWidth?: number
  /** Controlled visible data-column keys. */
  visibleColumns?: readonly string[]
  /** Controlled data-column widths in pixels. */
  columnSizing?: Readonly<Record<string, number>>
  /** Enables manual ordering; requires `rowKey` and disables paging/sorting. */
  reorderable?: boolean
  rowKey?: string | ((record: TRecord) => string | number)
  schema?: ValidationSchema<TQuery>
}

export interface RowReorderPayload<TRecord extends object = Record<string, unknown>> {
  rows: TRecord[]
  oldIndex: number
  newIndex: number
  moved: TRecord
  query: QueryValues
}

export interface DetailProps<TRecord extends object = Record<string, unknown>> {
  fields: FieldsInput<TRecord>
  id?: RecordIdentity
  data?: TRecord
  load?: Load<RecordLoadContext, RecordResult<TRecord>>
  searchParameters?: Record<string, unknown>
  /** Cache identity shared with other views of the same record. */
  namespace?: QueryNamespace
}

export type FormSubmitHandler<TInput extends object = Record<string, unknown>, TResult = unknown> = (
  draft: TInput,
) => MaybePromise<TResult>

export interface FormPropsBase<TInput extends object = Record<string, unknown>, TResult = unknown> {
  fields: FieldsInput<TInput, TInput>
  /** Prefilled values; loaded values override these, and user edits override both. */
  initialData?: Partial<TInput>
  load?: Load<RecordLoadContext, Partial<TInput> | undefined>
  searchParameters?: Record<string, unknown>
  /** Validates the visibility-filtered draft before submission. */
  schema?: ValidationSchema<TInput>
  /** Normalizes a rejected submission into field-level issues. */
  normalizeError?: (error: unknown) => SubmitError
  /** Cache identity for the optional initial-data load. */
  namespace?: QueryNamespace
  /** Renders every input read-only. */
  disabled?: boolean
}

/** Normal Form operation. Submission is supplied by its resource or caller. */
export interface FormSubmitProps<TInput extends object = Record<string, unknown>, TResult = unknown>
  extends FormPropsBase<TInput, TResult> {
  submit: FormSubmitHandler<TInput, TResult>
  modelValue?: never
}

/**
 * A present `v-model` puts Form in model-bound operation. No separate mode
 * flag is needed; its value may still be `undefined` during initialization.
 */
export interface FormModelProps<TInput extends object = Record<string, unknown>, TResult = unknown>
  extends FormPropsBase<TInput, TResult> {
  modelValue: Partial<TInput> | undefined
  submit?: FormSubmitHandler<TInput, TResult>
}

export type FormProps<TInput extends object = Record<string, unknown>, TResult = unknown> =
  | FormSubmitProps<TInput, TResult>
  | FormModelProps<TInput, TResult>
