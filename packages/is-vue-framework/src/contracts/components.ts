/**
 * Core component prop contracts.
 *
 * `Table`, `Detail`, and `Form` are resource-agnostic: they own data and field
 * orchestration only. Cards, headings, toolbars, and standard controls belong
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
import type { QueryNamespace } from './query'
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
  /** Externally controlled query state; replaces the component's own namespaced state. */
  query?: TQuery
  schema?: ValidationSchema<TQuery>
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

export interface FormProps<TInput extends object = Record<string, unknown>, TResult = unknown> {
  fields: FieldsInput<TInput, TInput>
  /** Prefilled values; loaded values override these, and user edits override both. */
  initialData?: Partial<TInput>
  load?: Load<RecordLoadContext, Partial<TInput> | undefined>
  submit: FormSubmitHandler<TInput, TResult>
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
