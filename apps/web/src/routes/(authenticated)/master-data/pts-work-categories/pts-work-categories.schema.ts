import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { ptsWorkCategory } from '@southneuhof/api/routes/pts-work-categories/pts-work-categories.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export const ptsWorkCategoriesSchema = defineSchema<AppResourceContract<typeof rpc['pts-work-categories']>>({
  identity: 'id',
  record: { schema: fromZod(ptsWorkCategory.schemas.select) },
  create: { schema: fromZod(ptsWorkCategory.schemas.create) },
  update: { schema: fromZod(ptsWorkCategory.schemas.update) },
})
