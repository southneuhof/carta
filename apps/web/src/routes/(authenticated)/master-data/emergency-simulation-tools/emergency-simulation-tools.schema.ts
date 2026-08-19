import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { emergencySimulationTool } from '@southneuhof/api/routes/emergency-simulation-tools/emergency-simulation-tools.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type EmergencySimulationTool = z.output<typeof emergencySimulationTool.schemas.select>
export type EmergencySimulationToolCreate = z.input<typeof emergencySimulationTool.schemas.create>
export type EmergencySimulationToolUpdate = z.input<typeof emergencySimulationTool.schemas.update>

export const emergencySimulationToolsSchema = defineSchema<AppResourceContract<typeof rpc['emergency-simulation-tools']>>({
  identity: 'id',
  record: { schema: fromZod(emergencySimulationTool.schemas.select) },
  create: { schema: fromZod(emergencySimulationTool.schemas.create) },
  update: { schema: fromZod(emergencySimulationTool.schemas.update) },
})

