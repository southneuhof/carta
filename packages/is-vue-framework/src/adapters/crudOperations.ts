import type { ModelConfig } from '@southneuhof/is-data-model'

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

export interface CRUDOperationAdapter<TResource = unknown> {
  createOperations(resource: TResource): CRUDOperations
}

let adapter: CRUDOperationAdapter<any> | undefined

export function configureCRUDOperationAdapter<TResource>(nextAdapter: CRUDOperationAdapter<TResource>) {
  adapter = nextAdapter
}

export function resolveCRUDOperations<TResource>(config: CRUDCompositeConfig<TResource>, direct: CRUDOperationOverrides = {}): CRUDOperations {
  const overrides = { ...config.operations, ...direct }
  const complete = overrides.list && overrides.detail && overrides.create && overrides.update && overrides.delete
  if (complete) return overrides as CRUDOperations
  if (!adapter) throw new Error('[vue-framework] Missing CRUD operation adapter. Register it with configureCRUDOperationAdapter().')
  return { ...adapter.createOperations(config.resource), ...overrides }
}

export function resetCRUDOperationAdapterForTests() {
  adapter = undefined
}
