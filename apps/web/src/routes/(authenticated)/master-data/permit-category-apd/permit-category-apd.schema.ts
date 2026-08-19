import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { permitCategoryApd } from '@southneuhof/api/routes/permit-category-apd/permit-category-apd.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type PermitCategoryApd = z.output<typeof permitCategoryApd.schemas.select>
export type PermitCategoryApdCreate = z.input<typeof permitCategoryApd.schemas.create>
export type PermitCategoryApdUpdate = z.input<typeof permitCategoryApd.schemas.update>

export const permitCategoryApdsSchema = defineSchema<AppResourceContract<(typeof rpc)['permit-category-apd']>>({
  identity: 'id',
  record: { schema: fromZod(permitCategoryApd.schemas.select) },
  create: { schema: fromZod(permitCategoryApd.schemas.create) },
  update: { schema: fromZod(permitCategoryApd.schemas.update) },
})
