import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { emergencySimulationEmployee } from '@southneuhof/api/routes/emergency-simulation-employees/emergency-simulation-employees.entity'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { z } from 'zod/v4'

export type EmergencySimulationEmployee = z.output<typeof emergencySimulationEmployee.schemas.select>
export type EmergencySimulationEmployeeCreate = z.input<typeof emergencySimulationEmployee.schemas.create>
export type EmergencySimulationEmployeeUpdate = z.input<typeof emergencySimulationEmployee.schemas.update>

export const emergencySimulationEmployeesSchema = defineSchema<AppResourceContract<(typeof rpc)['emergency-simulation-employees']>>({
  identity: 'id',
  record: { schema: fromZod(emergencySimulationEmployee.schemas.select) },
  create: { schema: fromZod(emergencySimulationEmployee.schemas.create) },
  update: { schema: fromZod(emergencySimulationEmployee.schemas.update) },
})
