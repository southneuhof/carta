import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { rootCause } from '@southneuhof/api/routes/root-causes/root-causes.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export const rootCausesSchema = defineSchema<AppResourceContract<(typeof rpc)['root-causes']>>({
  identity: 'id',
  record: { schema: fromZod(rootCause.schemas.select) },
  create: { schema: fromZod(rootCause.schemas.create) },
  update: { schema: fromZod(rootCause.schemas.update) },
})
