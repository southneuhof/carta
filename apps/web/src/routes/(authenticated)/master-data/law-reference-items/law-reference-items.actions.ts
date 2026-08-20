import type { CollectionLoadContext, CollectionResult, RecordIdentity } from '@southneuhof/is-vue-framework'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { parseHonoResponse } from '@/framework/hono'
import { apiUrl } from '@/framework/rpc'
import { createRpcClient } from '@southneuhof/sdk'
import type { LawReferenceItem, LawReferenceItemCreate, LawReferenceItemUpdate } from './law-reference-items.schema'

type JsonEndpoint = (input?: unknown, options?: unknown) => Promise<Response>
type LawReferenceRpc = {
  list: { $get: JsonEndpoint }
  detail: { ':id': { $get: JsonEndpoint } }
  create: { $post: JsonEndpoint }
  update: { ':id': { $patch: JsonEndpoint } }
  delete: { ':id': { $delete: JsonEndpoint } }
  tree: { $get: JsonEndpoint }
}

const lawReferenceRpc = (createRpcClient(apiUrl) as unknown as { 'law-reference-items': LawReferenceRpc })['law-reference-items']

export type LawReferenceTreeNode = LawReferenceItem & { children: LawReferenceTreeNode[] }
export type LawReferenceTree = {
  categories: Array<{ id: string; name: string; code: string; active: boolean }>
  category: { id: string; name: string; code: string; active: boolean }
  items: LawReferenceTreeNode[]
}

function wireQuery(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value != null && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
}

function wireId(id: RecordIdentity) {
  return typeof id === 'object' ? Object.values(id).map(String).join('/') : String(id)
}

async function apiResponse<T>(endpoint: JsonEndpoint, input: unknown, options?: unknown) {
  return parseHonoResponse<JsonEndpoint>(await endpoint(input, options)) as Promise<T>
}

async function list({ query, searchParameters, signal }: CollectionLoadContext<Record<string, unknown>>): Promise<CollectionResult<LawReferenceItem>> {
  const result = await apiResponse<{ data: LawReferenceItem[]; page: number; limit: number; total: number }>(
    lawReferenceRpc.list.$get,
    { query: wireQuery({ ...searchParameters, ...query }) },
    { init: { signal } }
  )
  return dataAdapter.normalizeCollection(result) as CollectionResult<LawReferenceItem>
}

async function detail({ id, searchParameters, signal }: { id?: RecordIdentity; searchParameters: Record<string, unknown>; signal?: AbortSignal }) {
  if (id === undefined) return undefined
  const result = await apiResponse<{ data: LawReferenceItem }>(lawReferenceRpc.detail[':id'].$get, { param: { id: wireId(id) }, query: wireQuery(searchParameters) }, { init: { signal } })
  return dataAdapter.normalizeRecord(result) as LawReferenceItem
}

async function create(input: LawReferenceItemCreate) {
  const result = await apiResponse<{ data: LawReferenceItem }>(lawReferenceRpc.create.$post, { json: input })
  return dataAdapter.normalizeRecord(result) as LawReferenceItem
}

async function update(id: RecordIdentity, input: LawReferenceItemUpdate) {
  const result = await apiResponse<{ data: LawReferenceItem }>(lawReferenceRpc.update[':id'].$patch, { param: { id: wireId(id) }, json: input })
  return dataAdapter.normalizeRecord(result) as LawReferenceItem
}

async function remove(id: RecordIdentity) {
  return apiResponse<{ ok: true }>(lawReferenceRpc.delete[':id'].$delete, { param: { id: wireId(id) } })
}

async function loadTree(categoryCode: string) {
  const result = await apiResponse<{ data: LawReferenceTree }>(lawReferenceRpc.tree.$get, { query: { lawReferenceCategoryCode: categoryCode } })
  return result.data
}

export const lawReferenceItemsActions = { list, detail, create, update, delete: remove, loadTree }
