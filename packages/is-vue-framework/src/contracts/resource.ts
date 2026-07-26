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

import type { AccessPolicy, ResourceOperation } from './access'
import type { DetailProps, FormProps, TableProps } from './components'
import type { FieldCatalog } from './fields'
import type { RecordIdentity } from './load'
import type { QueryNamespace } from './query'
import type { ValidationSchema } from './validation'

export type ResourceKey = string

export interface ResourceSchemas<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
  TCreate extends Record<string, unknown> = Record<string, unknown>,
  TUpdate extends Record<string, unknown> = TCreate,
> {
  record?: ValidationSchema<TRecord>
  query?: ValidationSchema<TQuery>
  create?: ValidationSchema<TCreate>
  update?: ValidationSchema<TUpdate>
}

export interface ResourceDefinitionBase<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
  TDraft extends Record<string, unknown> = TRecord,
> {
  key: ResourceKey
  identity?: (record: TRecord) => RecordIdentity
  fields?: FieldCatalog<TRecord, TDraft>
  /** Permission identity per operation; defaults derive from `key`. */
  permissions?: Partial<Record<ResourceOperation, string>>
  policy?: AccessPolicy<TRecord>
}

export interface TableFactoryArguments<TQuery extends Record<string, unknown> = Record<string, unknown>> {
  searchParameters?: Record<string, unknown>
  namespace?: QueryNamespace
  query?: TQuery
}

export interface DetailFactoryArguments {
  id: RecordIdentity
  searchParameters?: Record<string, unknown>
}

export interface CreateFormFactoryArguments<TCreate extends Record<string, unknown> = Record<string, unknown>> {
  initialData?: Partial<TCreate>
  searchParameters?: Record<string, unknown>
}

export interface UpdateFormFactoryArguments<TUpdate extends Record<string, unknown> = Record<string, unknown>> {
  id: RecordIdentity
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
  TRecord extends Record<string, unknown> = Record<string, unknown>,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
  TCreate extends Record<string, unknown> = Record<string, unknown>,
  TUpdate extends Record<string, unknown> = TCreate,
> {
  table: (args?: TableFactoryArguments<TQuery>) => TableProps<TRecord, TQuery>
  detail: (args: DetailFactoryArguments) => DetailProps<TRecord>
  form: {
    (): FormProps<TCreate>
    (args: CreateFormFactoryArguments<TCreate>): FormProps<TCreate>
    (args: UpdateFormFactoryArguments<TUpdate>): FormProps<TUpdate>
  }
}

export interface ResourceInvalidationArguments {
  id?: RecordIdentity
  searchParameters?: Record<string, unknown>
}

export interface Resource<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
  TCreate extends Record<string, unknown> = Record<string, unknown>,
  TUpdate extends Record<string, unknown> = TCreate,
> extends ResourceDefinitionBase<TRecord, TCreate>,
    ResourcePropFactories<TRecord, TQuery, TCreate, TUpdate> {
  schemas?: ResourceSchemas<TRecord, TQuery, TCreate, TUpdate>
  /** Semantic invalidation for custom workflows; never a raw query key. */
  invalidate: (args?: ResourceInvalidationArguments) => Promise<void>
}
