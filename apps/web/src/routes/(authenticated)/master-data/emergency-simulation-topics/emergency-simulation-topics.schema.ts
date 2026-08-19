import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { emergencySimulationTopic } from '@southneuhof/api/routes/emergency-simulation-topics/emergency-simulation-topics.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type EmergencySimulationTopic = z.output<typeof emergencySimulationTopic.schemas.select>
export type EmergencySimulationTopicCreate = z.input<typeof emergencySimulationTopic.schemas.create>
export type EmergencySimulationTopicUpdate = z.input<typeof emergencySimulationTopic.schemas.update>

export const emergencySimulationTopicsSchema = defineSchema<AppResourceContract<(typeof rpc)['emergency-simulation-topics']>>({
  identity: 'id',
  record: { schema: fromZod(emergencySimulationTopic.schemas.select) },
  create: { schema: fromZod(emergencySimulationTopic.schemas.create) },
  update: { schema: fromZod(emergencySimulationTopic.schemas.update) },
})
