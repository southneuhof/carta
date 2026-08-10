import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { businessCategory } from '@southneuhof/api/routes/business-categories/business-categories.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const businessCategoryOperations = createHonoResourceOperations(rpc['business-categories'], dataAdapter)
export type BusinessCategory = z.output<typeof businessCategory.schemas.select>
export type BusinessCategoryCreate = z.input<typeof businessCategory.schemas.create>
export type BusinessCategoryUpdate = z.input<typeof businessCategory.schemas.update>
