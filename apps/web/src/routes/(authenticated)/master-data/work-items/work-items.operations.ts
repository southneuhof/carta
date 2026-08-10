import { createHonoResourceOperations, parseHonoResponse } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import { workItem } from '@southneuhof/api/routes/work-items/work-items.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const workItemOperations = defineResourceOperations<WorkItem, Record<string, never>, WorkItemCreate, WorkItemUpdate>()(createHonoResourceOperations(rpc['work-items'], dataAdapter))
export type WorkItem = z.output<typeof workItem.schemas.select> & Record<string, unknown>
export type WorkItemCreate = z.input<typeof workItem.schemas.create>
export type WorkItemUpdate = z.input<typeof workItem.schemas.update>

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

type WorkItemTreeEndpoint = (typeof rpc)['work-items']['tree']['$get']

export async function loadWorkItemTree(projectId: string) {
  return (await parseHonoResponse<WorkItemTreeEndpoint>(await rpc['work-items'].tree.$get({ query: { projectId } }))).data as WorkItemTreeNode[]
}
