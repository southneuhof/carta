/**
 * Resource contracts.
 *
 * A resource owns ordinary data behavior and exposes prop factories returning
 * exact native core-component props. Identity and scoping are call arguments;
 * parent scoping is an ordinary `searchParameters` entry — there is no `parent`
 * vocabulary, no nested-resource kind, and no form mode.
 *
 * Plan 006 implements `defineResource` against these contracts.
 */

import type { AccessPolicy } from './access'
import type { DetailProps, FormProps, TableProps } from './components'
import type { FieldCatalog } from './fields'
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

export interface ResourceDefinitionBase<
  TRecord extends object = Record<string, unknown>,
  TDraft extends object = TRecord,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> {
  key: ResourceKey
  identity?: IdentityDeclaration<TRecord, TIdentity>
  fields?: FieldCatalog<TRecord, TDraft>
  policy?: AccessPolicy<TRecord>
}

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

/**
 * `form()` wires create submit and the create schema; `form({ id })` wires the
 * record load, update submit, and the update schema. `id` is non-nullable, so a
 * possibly-undefined route parameter is a compile error rather than a silent
 * create form.
 */
export interface ResourcePropFactories<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> {
  table: (args?: TableFactoryArguments<TQuery>) => TableProps<TRecord, TQuery>
  detail: (args: DetailFactoryArguments<TIdentity>) => DetailProps<TRecord>
  form: {
    (): FormProps<TCreate>
    (args: CreateFormFactoryArguments<TCreate>): FormProps<TCreate>
    (args: UpdateFormFactoryArguments<TUpdate, TIdentity>): FormProps<TUpdate>
  }
}

export interface ResourceInvalidationArguments<TIdentity extends RecordIdentity = RecordIdentityValue> {
  id?: TIdentity
  searchParameters?: Record<string, unknown>
}

export interface Resource<
  TRecord extends object = Record<string, unknown>,
  TQuery extends object = Record<string, unknown>,
  TCreate extends object = Record<string, unknown>,
  TUpdate extends object = TCreate,
  TIdentity extends RecordIdentity = RecordIdentityValue,
> extends ResourceDefinitionBase<TRecord, TCreate, TIdentity>,
    ResourcePropFactories<TRecord, TQuery, TCreate, TUpdate, TIdentity> {
  schemas?: ResourceSchemas<TRecord, TQuery, TCreate, TUpdate>
  /** Semantic invalidation for custom workflows; never a raw query key. */
  invalidate: (args?: ResourceInvalidationArguments<TIdentity>) => Promise<void>
}
