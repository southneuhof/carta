import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { division } from '@southneuhof/api/routes/divisions/divisions.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type DivisionCreate = z.input<typeof division.schemas.create>
export type DivisionUpdate = z.input<typeof division.schemas.update>

export const divisionsSchema = defineSchema<AppResourceContract<typeof rpc.divisions>>({
  identity: 'id',
  record: { schema: fromZod(division.schemas.select) },
  create: { schema: fromZod(division.schemas.create) },
  update: { schema: fromZod(division.schemas.update) },
})
