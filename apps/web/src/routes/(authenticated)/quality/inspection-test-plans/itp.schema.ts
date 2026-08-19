import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { inspectionTestPlanRecordSchema, createInspectionTestPlanSchema, updateInspectionTestPlanSchema } from '@southneuhof/api/routes/inspection-test-plans/inspection-test-plans.schemas'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type ItpCreate = z.input<typeof createInspectionTestPlanSchema>
export type ItpUpdate = z.input<typeof updateInspectionTestPlanSchema>

export const itpSchema = defineSchema<AppResourceContract<(typeof rpc)['inspection-test-plans']>>({
  identity: 'id',
  record: { schema: fromZod(inspectionTestPlanRecordSchema) },
  create: { schema: fromZod(createInspectionTestPlanSchema) },
  update: { schema: fromZod(updateInspectionTestPlanSchema) },
})

export const itpTypeOptions = [
  { id: 'material', name: 'Material' },
  { id: 'process', name: 'Process' },
  { id: 'product', name: 'Product' },
] as const
