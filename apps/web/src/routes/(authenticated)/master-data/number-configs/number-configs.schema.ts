import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { numberConfig } from '@southneuhof/api/routes/number-configs/number-configs.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export const numberConfigsSchema = defineSchema<AppResourceContract<(typeof rpc)['number-configs']>>({
  identity: 'id',
  record: { schema: fromZod(numberConfig.schemas.select) },
  create: { schema: fromZod(numberConfig.schemas.create) },
  update: { schema: fromZod(numberConfig.schemas.update) },
})
