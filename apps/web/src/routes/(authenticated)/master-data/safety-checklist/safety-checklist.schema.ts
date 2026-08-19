import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { safetyChecklist } from '@southneuhof/api/routes/safety-checklist/safety-checklist.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type SafetyChecklist = z.output<typeof safetyChecklist.schemas.select>
export type SafetyChecklistCreate = z.input<typeof safetyChecklist.schemas.create>
export type SafetyChecklistUpdate = z.input<typeof safetyChecklist.schemas.update>

export const safetyChecklistsSchema = defineSchema<AppResourceContract<(typeof rpc)['safety-checklist']>>({
  identity: 'id',
  record: { schema: fromZod(safetyChecklist.schemas.select) },
  create: { schema: fromZod(safetyChecklist.schemas.create) },
  update: { schema: fromZod(safetyChecklist.schemas.update) },
})
