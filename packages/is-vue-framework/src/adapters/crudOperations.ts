import type { ModelConfig } from '../model-config'

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

export interface CRUDResource<
  TRecord extends CRUDRecord = CRUDRecord,
  TCreateInput extends CRUDRecord = CRUDRecord,
  TUpdateInput extends CRUDRecord = TCreateInput,
  TQuery extends CRUDQuery = CRUDQuery,
  TIdentity extends CRUDIdentity = CRUDIdentity,
> {
  list: CRUDListOperation<TRecord, TQuery>
  detail: CRUDDetailOperation<TRecord, TQuery, TIdentity>
  create: CRUDMutationOperation<TRecord, TCreateInput>
  update: CRUDUpdateOperation<TRecord, TUpdateInput, TIdentity>
  delete: CRUDDeleteOperation<TIdentity>
}

export type CRUDOperations<TResource extends CRUDResource = CRUDResource> = TResource & {
  export?: CRUDExportOperation<ResourceQuery<TResource>>
  reorder?: CRUDReorderOperation
}

export type CRUDOperationOverrides<TResource extends CRUDResource = CRUDResource> = Partial<CRUDOperations<TResource>>

export type ResourceRecord<T extends CRUDResource> = Awaited<ReturnType<T['list']>>['data'][number]
export type ResourceCreateInput<T extends CRUDResource> = Parameters<T['create']>[0]
export type ResourceUpdateInput<T extends CRUDResource> = Parameters<T['update']>[1]
export type ResourceQuery<T extends CRUDResource> = NonNullable<Parameters<T['list']>[0]>
export type ResourceIdentity<T extends CRUDResource> = Exclude<Parameters<T['detail']>[0], readonly CRUDIdentity[]>

type ResourceConfig<TResource extends CRUDResource> = Omit<ModelConfig<ResourceRecord<TResource>, ResourceCreateInput<TResource>, ResourceUpdateInput<TResource>>, 'modelAPI'> & {
  resource: TResource
  operations?: CRUDOperationOverrides<TResource>
}

type ResourceLessConfig<TResource extends CRUDResource> = Omit<ModelConfig<ResourceRecord<TResource>, ResourceCreateInput<TResource>, ResourceUpdateInput<TResource>>, 'modelAPI'> & {
  resource?: never
  operations: CRUDOperations<TResource>
}

export type CRUDCompositeConfig<TResource extends CRUDResource = CRUDResource> = ResourceConfig<TResource> | ResourceLessConfig<TResource>

export function resolveCRUDOperations<TResource extends CRUDResource>(config: CRUDCompositeConfig<TResource>, direct: CRUDOperationOverrides<TResource> = {}): CRUDOperations<TResource> {
  const resource = 'resource' in config ? config.resource : undefined
  const operations = { ...resource, ...config.operations, ...direct }
  const required = ['list', 'detail', 'create', 'update', 'delete'] as const
  const missing = required.find(operation => typeof operations[operation] !== 'function')
  if (missing) throw new Error(`[vue-framework] Missing CRUD operation: ${missing}. Supply a resource or complete operations.`)
  return operations as CRUDOperations<TResource>
}

export function useCRUDOperations<TResource extends CRUDResource>(config: CRUDCompositeConfig<TResource>, direct: CRUDOperationOverrides<TResource> = {}): CRUDOperations<TResource> {
  return resolveCRUDOperations(config, direct)
}
