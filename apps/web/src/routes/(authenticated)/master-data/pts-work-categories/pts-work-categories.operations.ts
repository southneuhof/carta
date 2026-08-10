import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { ptsWorkCategory } from '@southneuhof/api/routes/pts-work-categories/pts-work-categories.entity'
import type { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

export const ptsWorkCategoryOperations = createHonoResourceOperations(rpc['pts-work-categories'], dataAdapter)
export type PtsWorkCategory = z.output<typeof ptsWorkCategory.schemas.select>
export type PtsWorkCategoryCreate = z.input<typeof ptsWorkCategory.schemas.create>
export type PtsWorkCategoryUpdate = z.input<typeof ptsWorkCategory.schemas.update>
