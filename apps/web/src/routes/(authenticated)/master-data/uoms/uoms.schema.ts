import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { uom } from '@southneuhof/api/routes/uoms/uoms.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export const uomsSchema = defineSchema<AppResourceContract<typeof rpc.uoms>>({
  identity: 'id',
  record: { schema: fromZod(uom.schemas.select) },
  create: { schema: fromZod(uom.schemas.create) },
  update: { schema: fromZod(uom.schemas.update) },
})
