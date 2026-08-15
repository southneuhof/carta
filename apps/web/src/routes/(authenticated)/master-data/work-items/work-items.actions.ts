import { createHonoResourceActions, parseHonoResponse } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import type { WorkItemCreate, WorkItemUpdate } from './work-items.schema'

const api = createHonoResourceActions(rpc['work-items'], dataAdapter)
type WorkItemTreeEndpoint = (typeof rpc)['work-items']['tree']['tree']['$get']

export type WorkItemTreeNode = {
  id: string
  projectId: string
  parentId: string | null
  level: number
  name: string
  categoryName: string | null
  volume: string | null
  uomName: string | null
  isHighRisk: boolean
  haveMaterialItp: boolean | null
  haveProcessItp: boolean | null
  haveProductsItp: boolean | null
  children: WorkItemTreeNode[]
}

async function loadTree(projectId: string) {
  return (await parseHonoResponse<WorkItemTreeEndpoint>(await rpc['work-items'].tree.tree.$get({ query: { projectId } }))).data as WorkItemTreeNode[]
}

export const workItemsActions = {
  list: api.list,
  detail: api.detail,
  create: (input: WorkItemCreate) => api.create(input),
  update: (id: Parameters<typeof api.update>[0], input: WorkItemUpdate) => api.update(id, input),
  delete: api.delete,
  loadTree,
}
