/**
 * Canonical migration contracts: types only, no behavior, no Vue or app
 * dependencies. Later phases extend these interfaces rather than creating
 * parallel concepts.
 */

export type {
  Load,
  LoadSignalContext,
  CollectionLoadContext,
  RecordLoadContext,
  MaybePromise,
  RecordIdentity,
} from './load'

export type { CollectionMeta, CollectionResult, RecordResult } from './results'

export type {
  FieldKey,
  FieldContext,
  FieldRead,
  FieldWrite,
  FieldRendererInfo,
  DisplayRendererContext,
  FormRendererContext,
  FieldBehavior,
  FieldBehaviorContext,
  FieldRendererSelection,
  FieldDisplayProjection,
  FieldTableProjection,
  FieldDetailProjection,
  FieldFormProjection,
  FieldDefinition,
  FieldCatalog,
  ResolvedField,
  FieldsInput,
  FieldSelection,
} from './fields'

export type { ValidationIssue, ValidationResult, ValidationSchema, SubmitError } from './validation'

export type { ResourceOperation, AccessRequest, AccessAdapter, AccessPolicy } from './access'

export type {
  QueryNamespace,
  QueryValues,
  QueryOwnership,
  QueryLocationAdapter,
  QueryKey,
  QueryFetchOptions,
  QueryInvalidation,
  QueryCacheAdapter,
  QueryAdapters,
} from './query'

export type { TableProps, DetailProps, FormProps, FormSubmitHandler } from './components'

export type {
  ResourceKey,
  ResourceSchemas,
  ResourceDefinitionBase,
  TableFactoryArguments,
  DetailFactoryArguments,
  CreateFormFactoryArguments,
  UpdateFormFactoryArguments,
  ResourcePropFactories,
  ResourceInvalidationArguments,
} from './resource'
