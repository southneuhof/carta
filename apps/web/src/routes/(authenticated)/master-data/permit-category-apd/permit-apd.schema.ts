import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { permitApd } from '@southneuhof/api/routes/permit-apd/permit-apd.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type PermitApd = z.output<typeof permitApd.schemas.select>
export type PermitApdCreate = z.input<typeof permitApd.schemas.create>
export type PermitApdUpdate = z.input<typeof permitApd.schemas.update>

export const permitApdsSchema = defineSchema<AppResourceContract<typeof rpc['permit-apd']>>({
  identity: 'id',
  record: { schema: fromZod(permitApd.schemas.select) },
  create: { schema: fromZod(permitApd.schemas.create) },
  update: { schema: fromZod(permitApd.schemas.update) },
})
