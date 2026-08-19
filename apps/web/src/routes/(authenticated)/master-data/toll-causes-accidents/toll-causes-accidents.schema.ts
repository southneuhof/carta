import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { tollCausesAccidentsCause } from '@southneuhof/api/routes/toll-causes-accidents/toll-causes-accidents.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type TollCausesAccidents = z.output<typeof tollCausesAccidentsCause.schemas.select>
export type TollCausesAccidentsCreate = z.input<typeof tollCausesAccidentsCause.schemas.create>
export type TollCausesAccidentsUpdate = z.input<typeof tollCausesAccidentsCause.schemas.update>

export const tollCausesAccidentsSchema = defineSchema<AppResourceContract<(typeof rpc)['toll-causes-accidents']>>({
  identity: 'id',
  record: { schema: fromZod(tollCausesAccidentsCause.schemas.select) },
  create: { schema: fromZod(tollCausesAccidentsCause.schemas.create) },
  update: { schema: fromZod(tollCausesAccidentsCause.schemas.update) },
})
