import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { permitWorkType } from '@southneuhof/api/routes/permit-work-types/permit-work-types.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type PermitWorkType = z.output<typeof permitWorkType.schemas.select>
export type PermitWorkTypeCreate = z.input<typeof permitWorkType.schemas.create>
export type PermitWorkTypeUpdate = z.input<typeof permitWorkType.schemas.update>

export const permitWorkTypesSchema = defineSchema<AppResourceContract<(typeof rpc)['permit-work-types']>>({
  identity: 'id',
  record: { schema: fromZod(permitWorkType.schemas.select) },
  create: { schema: fromZod(permitWorkType.schemas.create) },
  update: { schema: fromZod(permitWorkType.schemas.update) },
})
