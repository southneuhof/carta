/**
 * Resource contracts.
 *
 * Shared inputs to resource surface factories. Runtime resource definitions and
 * their table/detail/form surface contracts live in `resources/defineResource`.
 * Identity and scoping are call arguments; parent scoping is an ordinary
 * `searchParameters` entry — there is no `parent` vocabulary, no nested-resource
 * kind, and no form mode.
 *
 * Plan 006 implements `defineResource` against these contracts.
 */

import type { RecordIdentity, RecordIdentityValue } from './load'
import type { QueryNamespace } from './query'
import type { ValidationSchema } from './validation'

export type ResourceKey = string

export interface ResourceSchemas<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
> {
  record?: ValidationSchema<TRecord>
  query?: ValidationSchema<TQuery>
  create?: ValidationSchema<TCreate>
  update?: ValidationSchema<TUpdate>
}

/**
 * Two spellings of an identity declaration: the key list (first-class — it
 * yields the extractor and the identity type from one declaration) and the
 * extractor function (escape hatch for derived or renamed shapes).
 */
export type IdentityDeclaration<TRecord extends object, TIdentity extends RecordIdentity = RecordIdentity> =
  | readonly (keyof TRecord & string)[]
  | ((record: TRecord) => TIdentity)

export interface TableFactoryArguments<TQuery extends object = Record<string, unknown>> {
  searchParameters?: Record<string, unknown>
  namespace?: QueryNamespace
  query?: TQuery
  pagination?: 'auto' | 'always' | false
}

export interface DetailFactoryArguments<TIdentity extends RecordIdentity = RecordIdentityValue> {
  id: TIdentity
  searchParameters?: Record<string, unknown>
}

export interface CreateFormFactoryArguments<TCreate extends object = Record<string, unknown>> {
  initialData?: Partial<TCreate>
  searchParameters?: Record<string, unknown>
}

export interface UpdateFormFactoryArguments<
  TUpdate extends object = Record<string, unknown>,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> {
  id: TIdentity
  initialData?: Partial<TUpdate>
  searchParameters?: Record<string, unknown>
}
