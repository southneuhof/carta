import type { ModelConfig } from '../model-config'
import { missingRuntimeCapability, type FrameworkCRUDRuntime } from '../runtime'
import { useFrameworkRuntime } from '../runtimeHooks'

export type CRUDIdentity = string | number
export type CRUDQuery = Record<string, any>
export type CRUDRecord = Record<string, any>

export type CRUDListResult<TRecord extends CRUDRecord = CRUDRecord> = {
  data: TRecord[]
  total?: number
  totalPage?: number
}

export type CRUDListOperation<TRecord extends CRUDRecord = CRUDRecord, TQuery extends CRUDQuery = CRUDQuery> = (query?: TQuery) => Promise<CRUDListResult<TRecord>>
export type CRUDDetailOperation<TRecord extends CRUDRecord = CRUDRecord, TQuery extends CRUDQuery = CRUDQuery, TIdentity extends CRUDIdentity = CRUDIdentity> = (id: TIdentity | TIdentity[], query?: TQuery) => Promise<TRecord | undefined>
export type CRUDMutationOperation<TRecord extends CRUDRecord = CRUDRecord, TInput extends CRUDRecord = CRUDRecord> = (input: TInput) => Promise<TRecord | void>
export type CRUDUpdateOperation<TRecord extends CRUDRecord = CRUDRecord, TInput extends CRUDRecord = CRUDRecord, TIdentity extends CRUDIdentity = CRUDIdentity> = (id: TIdentity | TIdentity[], input: TInput) => Promise<TRecord | void>
export type CRUDDeleteOperation<TIdentity extends CRUDIdentity = CRUDIdentity> = (id: TIdentity) => Promise<unknown>
export type CRUDExportOperation<TQuery extends CRUDQuery = CRUDQuery> = (params: { query: TQuery; config: Record<string, any> }) => Promise<unknown>
export type CRUDReorderOperation = (event: any) => Promise<unknown> | unknown

declare const crudResourceMetadata: unique symbol

/** Inert endpoint identity carrying CRUD contract metadata only at compile time. */
export type CRUDResource<
  TName extends string = string,
  TRecord extends CRUDRecord = CRUDRecord,
  TCreateInput extends CRUDRecord = CRUDRecord,
  TUpdateInput extends CRUDRecord = TCreateInput,
  TQuery extends CRUDQuery = CRUDQuery,
  TIdentity extends CRUDIdentity = CRUDIdentity,
> = TName & {
  readonly [crudResourceMetadata]: {
    record: TRecord
    createInput: TCreateInput
    updateInput: TUpdateInput
    query: TQuery
    identity: TIdentity
  }
}

type ResourceMetadata<T extends CRUDResource> = T[typeof crudResourceMetadata]
export type ResourceRecord<T extends CRUDResource> = ResourceMetadata<T>['record']
export type ResourceCreateInput<T extends CRUDResource> = ResourceMetadata<T>['createInput']
export type ResourceUpdateInput<T extends CRUDResource> = ResourceMetadata<T>['updateInput']
export type ResourceQuery<T extends CRUDResource> = ResourceMetadata<T>['query']
export type ResourceIdentity<T extends CRUDResource> = ResourceMetadata<T>['identity']

export type CRUDOperations<TResource extends CRUDResource = CRUDResource> = {
  list: CRUDListOperation<ResourceRecord<TResource>, ResourceQuery<TResource>>
  detail: CRUDDetailOperation<ResourceRecord<TResource>, ResourceQuery<TResource>, ResourceIdentity<TResource>>
  create: CRUDMutationOperation<ResourceRecord<TResource>, ResourceCreateInput<TResource>>
  update: CRUDUpdateOperation<ResourceRecord<TResource>, ResourceUpdateInput<TResource>, ResourceIdentity<TResource>>
  delete: CRUDDeleteOperation<ResourceIdentity<TResource>>
  export?: CRUDExportOperation<ResourceQuery<TResource>>
  reorder?: CRUDReorderOperation
}

export type CRUDOperationOverrides<TResource extends CRUDResource = CRUDResource> = Partial<CRUDOperations<TResource>>

type ResourceConfig<TResource extends CRUDResource> = Omit<ModelConfig<ResourceRecord<TResource>, ResourceCreateInput<TResource>, ResourceUpdateInput<TResource>>, 'modelAPI'> & {
  resource: TResource
  operations?: CRUDOperationOverrides<TResource>
}

type ResourceLessConfig<TResource extends CRUDResource> = Omit<ModelConfig<ResourceRecord<TResource>, ResourceCreateInput<TResource>, ResourceUpdateInput<TResource>>, 'modelAPI'> & {
  resource?: never
  operations: CRUDOperations<TResource>
}

export type CRUDCompositeConfig<TResource extends CRUDResource = CRUDResource> = ResourceConfig<TResource> | ResourceLessConfig<TResource>

export function resolveCRUDOperations<TResource extends CRUDResource>(config: CRUDCompositeConfig<TResource>, direct: CRUDOperationOverrides<TResource> = {}, crud?: FrameworkCRUDRuntime): CRUDOperations<TResource> {
  const overrides = { ...config.operations, ...direct }
  const complete = overrides.list && overrides.detail && overrides.create && overrides.update && overrides.delete
  if (complete) return overrides as CRUDOperations<TResource>
  const resource = config.resource
  if (!resource) throw new Error('[vue-framework] Resource-less CRUD config requires complete operations.')

  return {
    list: overrides.list || (async query => (crud?.list || missingRuntimeCapability('crud.list'))({ resource, query })),
    detail: overrides.detail || (async (id, query) => (crud?.detail || missingRuntimeCapability('crud.detail'))({ resource, id, query })),
    create: overrides.create || (async input => (crud?.create || missingRuntimeCapability('crud.create'))({ resource, input })),
    update: overrides.update || (async (id, input) => (crud?.update || missingRuntimeCapability('crud.update'))({ resource, id, input })),
    delete: overrides.delete || (async id => (crud?.delete || missingRuntimeCapability('crud.delete'))({ resource, id })),
    export: overrides.export || (crud?.export ? ({ query, config: operationConfig }) => crud.export!({ resource, query, config: operationConfig }) : undefined),
    reorder: overrides.reorder || (crud?.reorder ? event => crud.reorder!({ resource, event }) : undefined),
  } as CRUDOperations<TResource>
}

export function useCRUDOperations<TResource extends CRUDResource>(config: CRUDCompositeConfig<TResource>, direct: CRUDOperationOverrides<TResource> = {}): CRUDOperations<TResource> {
  return resolveCRUDOperations(config, direct, useFrameworkRuntime().crud)
}
