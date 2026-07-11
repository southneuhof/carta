import type { ModelConfig } from '@southneuhof/is-data-model'
import { getFrameworkBehaviors, missingBehavior } from './behaviors'

export type CRUDIdentity = string | number
export type CRUDQuery = Record<string, any>
export type CRUDRecord = Record<string, any>

export type CRUDListResult = {
  data: CRUDRecord[]
  total?: number
  totalPage?: number
}

export type CRUDListOperation = (query?: CRUDQuery) => Promise<CRUDListResult>
export type CRUDDetailOperation = (id: CRUDIdentity | CRUDIdentity[], query?: CRUDQuery) => Promise<CRUDRecord | undefined>
export type CRUDMutationOperation = (input: CRUDRecord) => Promise<CRUDRecord | void>
export type CRUDUpdateOperation = (id: CRUDIdentity | CRUDIdentity[], input: CRUDRecord) => Promise<CRUDRecord | void>
export type CRUDDeleteOperation = (id: CRUDIdentity) => Promise<unknown>
export type CRUDExportOperation = (params: { query: CRUDQuery; config: Record<string, any> }) => Promise<unknown>
export type CRUDReorderOperation = (event: any) => Promise<unknown> | unknown

export interface CRUDOperations {
  list: CRUDListOperation
  detail: CRUDDetailOperation
  create: CRUDMutationOperation
  update: CRUDUpdateOperation
  delete: CRUDDeleteOperation
  export?: CRUDExportOperation
  reorder?: CRUDReorderOperation
}

export type CRUDOperationOverrides = Partial<CRUDOperations>

export type CRUDCompositeConfig<TResource = unknown> = Omit<ModelConfig, 'modelAPI'> & {
  resource: TResource
  operations?: CRUDOperationOverrides
}

export function defineCRUDCompositeConfig<const TResource, const TConfig extends CRUDCompositeConfig<TResource>>(config: TConfig): TConfig {
  return config
}

export function resolveCRUDOperations<TResource>(config: CRUDCompositeConfig<TResource>, direct: CRUDOperationOverrides = {}): CRUDOperations {
  const overrides = { ...config.operations, ...direct }
  const complete = overrides.list && overrides.detail && overrides.create && overrides.update && overrides.delete
  if (complete) return overrides as CRUDOperations
  const crud = getFrameworkBehaviors().crud
  return {
    list: overrides.list || (async (query) => (crud?.list || missingBehavior('crud.list'))({ resource: config.resource, query })),
    detail: overrides.detail || (async (id, query) => (crud?.detail || missingBehavior('crud.detail'))({ resource: config.resource, id, query })),
    create: overrides.create || (async (input) => (crud?.create || missingBehavior('crud.create'))({ resource: config.resource, input })),
    update: overrides.update || (async (id, input) => (crud?.update || missingBehavior('crud.update'))({ resource: config.resource, id, input })),
    delete: overrides.delete || (async (id) => (crud?.delete || missingBehavior('crud.delete'))({ resource: config.resource, id })),
    export: overrides.export || (crud?.export ? (({ query, config: operationConfig }) => crud.export!({ resource: config.resource, query, config: operationConfig })) : undefined),
    reorder: overrides.reorder || (crud?.reorder ? ((event) => crud.reorder!({ resource: config.resource, event })) : undefined),
  }
}
