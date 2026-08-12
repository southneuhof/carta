import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { numberVariable } from '@southneuhof/api/routes/number-variables/number-variables.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export const numberVariablesSchema = defineSchema<AppResourceContract<typeof rpc['number-variables']>>({
  identity: 'id',
  record: { schema: fromZod(numberVariable.schemas.select) },
})
