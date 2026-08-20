import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { toolsBrand } from '@southneuhof/api/routes/tools-brands/tools-brands.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type ToolsBrand = z.output<typeof toolsBrand.schemas.select>
export type ToolsBrandCreate = z.input<typeof toolsBrand.schemas.create>
export type ToolsBrandUpdate = z.input<typeof toolsBrand.schemas.update>

export const toolsBrandsSchema = defineSchema<AppResourceContract<typeof rpc['tools-brands']>>({
  identity: 'id',
  record: { schema: fromZod(toolsBrand.schemas.select) },
  create: { schema: fromZod(toolsBrand.schemas.create) },
  update: { schema: fromZod(toolsBrand.schemas.update) },
})

