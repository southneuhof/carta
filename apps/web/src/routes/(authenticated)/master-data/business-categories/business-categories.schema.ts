import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { businessCategory } from '@southneuhof/api/routes/business-categories/business-categories.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type BusinessCategory = z.output<typeof businessCategory.schemas.select>
export type BusinessCategoryCreate = z.input<typeof businessCategory.schemas.create>
export type BusinessCategoryUpdate = z.input<typeof businessCategory.schemas.update>

export const businessCategoriesSchema = defineSchema<AppResourceContract<typeof rpc['business-categories']>>({
  identity: 'id',
  record: { schema: fromZod(businessCategory.schemas.select) },
  create: { schema: fromZod(businessCategory.schemas.create) },
  update: { schema: fromZod(businessCategory.schemas.update) },
})
