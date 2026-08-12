import { createHonoResourceActions, parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { CollectionLoadContext, CollectionResult, RecordIdentity } from '@southneuhof/is-vue-framework'
import type { LookupOption, PtsLookups } from './pts.schema'
import type { PtsCreate, PtsUpdate } from './pts.schema'

const api = createHonoResourceActions(rpc['qhsse-pts'], dataAdapter)
type LookupEndpoint = (typeof rpc)['qhsse-pts']['lookups']['$get']
type ActionEndpoint = (typeof rpc)['qhsse-pts']['action'][':id']['actions'][':action']['$post']
type ActionResult = HonoResponseOf<ActionEndpoint, 200>['data']

export async function loadLookups(projectId?: string): Promise<PtsLookups> {
  const response = await rpc['qhsse-pts'].lookups.$get({ query: projectId ? { projectId } : {} })
  return (await parseHonoResponse<LookupEndpoint>(response)).data as PtsLookups
}

function text(option: LookupOption) {
  return `${option.code ?? ''} ${option.name}`.toLocaleLowerCase()
}

function descendants(items: LookupOption[], categoryId: string) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const children = new Map<string, string[]>()
  for (const item of items) if (item.parentId) children.set(item.parentId, [...(children.get(item.parentId) ?? []), item.id])
  const result = new Set<string>()
  const visit = (id: string) => {
    for (const child of children.get(id) ?? []) {
      result.add(child)
      visit(child)
    }
  }
  if (byId.has(categoryId)) visit(categoryId)
  return result
}

export function lookupOptions(kind: keyof PtsLookups, context: CollectionLoadContext<Record<string, unknown>>): Promise<CollectionResult<LookupOption>> {
  return loadLookups(typeof context.searchParameters.projectId === 'string' ? context.searchParameters.projectId : undefined).then((lookups) => {
    let options = [...lookups[kind]]
    const projectId = typeof context.searchParameters.projectId === 'string' ? context.searchParameters.projectId : undefined
    if (projectId) options = options.filter((option) => !option.projectId || option.projectId === projectId)
    if (kind === 'projects' && typeof context.searchParameters.divisionId === 'string') options = options.filter((option) => option.divisionId === context.searchParameters.divisionId)
    if (kind === 'workItems') {
      const allItems = options
      if (typeof context.searchParameters.workItemCategoryId === 'string') {
        const allowed = descendants(allItems, context.searchParameters.workItemCategoryId)
        options = options.filter((option) => allowed.has(option.id))
      }
      if (context.searchParameters.rootOnly === true) options = options.filter((option) => option.parentId == null)
      if (context.searchParameters.leafOnly === true) {
        const parents = new Set(allItems.map((option) => option.parentId).filter((value): value is string => Boolean(value)))
        options = options.filter((option) => option.parentId != null && !parents.has(option.id))
      }
    }
    if (typeof context.searchParameters.search === 'string' && context.searchParameters.search) {
      const search = context.searchParameters.search.toLocaleLowerCase()
      options = options.filter((option) => text(option).includes(search))
    }
    return { data: options }
  })
}

export function lookupDetail(kind: keyof PtsLookups, context: { id?: RecordIdentity; searchParameters: Record<string, unknown> }) {
  if (context.id === undefined) return Promise.resolve(undefined)
  const id = typeof context.id === 'object' ? String(Object.values(context.id)[0]) : String(context.id)
  return loadLookups(typeof context.searchParameters.projectId === 'string' ? context.searchParameters.projectId : undefined)
    .then((lookups) => lookups[kind].find((option) => option.id === id))
}

export async function runAction(id: RecordIdentity, action: string, input: object): Promise<ActionResult> {
  const response = await rpc['qhsse-pts'].action[':id'].actions[':action'].$post({ param: { id: String(id), action }, json: input })
  return (await parseHonoResponse<ActionEndpoint>(response)).data
}

export const ptsActions = {
  list: api.list,
  detail: api.detail,
  create: (input: PtsCreate) => api.create(input),
  update: (id: RecordIdentity, input: PtsUpdate) => api.update(id, input),
  action: runAction,
  deleteReport: (id: RecordIdentity, deletedReason: string) => runAction(id, 'delete', { deletedReason }),
}
