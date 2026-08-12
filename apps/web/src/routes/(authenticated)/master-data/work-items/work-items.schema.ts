import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { workItem } from '@southneuhof/api/routes/work-items/work-items.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type WorkItemCreate = z.input<typeof workItem.schemas.create>
export type WorkItemUpdate = z.input<typeof workItem.schemas.update>

export const workItemsSchema = defineSchema<AppResourceContract<typeof rpc['work-items']>>({
  identity: 'id',
  record: { schema: fromZod(workItem.schemas.select) },
  create: { schema: fromZod(workItem.schemas.create) },
  update: { schema: fromZod(workItem.schemas.update) },
})
