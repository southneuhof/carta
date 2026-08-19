import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { permitDangerSource } from '@southneuhof/api/routes/permit-danger-source/permit-danger-source.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type PermitDangerSource = z.output<typeof permitDangerSource.schemas.select>
export type PermitDangerSourceCreate = z.input<typeof permitDangerSource.schemas.create>
export type PermitDangerSourceUpdate = z.input<typeof permitDangerSource.schemas.update>

export const permitDangerSourcesSchema = defineSchema<AppResourceContract<typeof rpc['permit-danger-source']>>({
  identity: 'id',
  record: { schema: fromZod(permitDangerSource.schemas.select) },
  create: { schema: fromZod(permitDangerSource.schemas.create) },
  update: { schema: fromZod(permitDangerSource.schemas.update) },
})
