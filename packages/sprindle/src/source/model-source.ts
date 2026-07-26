import type { Context } from 'hono'

export type ModelRuntimeEntity<TTable = unknown> = {
  name: string
  table?: TTable
  source: ModelSource
}

/** The app's single answer to "who is calling"; installed through `installSprindle` options. */
export type IdentityResolver = (c: Context) => unknown | Promise<unknown>

export type ModelRuntimeContext<TTable = unknown> = {
  name: string
  entity: ModelRuntimeEntity<TTable>
  identity?: IdentityResolver
}

export type SourceListResult<TRecord> = {
  data: TRecord[]
  total: number
}

export type ModelSource<TRecord = unknown> = {
  list: (args: { query: Record<string, unknown>; context: ModelRuntimeContext }) => Promise<SourceListResult<TRecord> | TRecord[]>
  detail: (args: { id: string; context: ModelRuntimeContext }) => Promise<TRecord | null | undefined>
  create: (args: { input: unknown; context: ModelRuntimeContext }) => Promise<TRecord>
  update: (args: { id: string; input: unknown; context: ModelRuntimeContext }) => Promise<TRecord | null | undefined>
  delete: (args: { id: string; context: ModelRuntimeContext }) => Promise<boolean | TRecord | null | undefined>
  materialize: (input: unknown | unknown[], args: { context: ModelRuntimeContext }) => Promise<TRecord | TRecord[]>
}
