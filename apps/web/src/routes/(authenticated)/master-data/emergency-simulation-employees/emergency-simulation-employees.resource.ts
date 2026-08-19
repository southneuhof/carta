import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { emergencySimulationEmployeesSchema } from './emergency-simulation-employees.schema'

const api = createHonoResourceActions(rpc['emergency-simulation-employees'], dataAdapter)

const fields = defineFields(emergencySimulationEmployeesSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
})

export const emergencySimulationEmployees = defineResource(emergencySimulationEmployeesSchema, {
  key: 'emergency-simulation-employees',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name],
      permission: 'view-emergency-simulation-employees',
      route: { name: 'master-data-emergency-simulation-employees' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name],
      permission: 'view-emergency-simulation-employees',
      route: { name: 'master-data-emergency-simulation-employees-detail', params: (id) => ({ emergencySimulationEmployeeId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name],
      permission: 'create-emergency-simulation-employees',
      route: { name: 'master-data-emergency-simulation-employees-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name],
      permission: 'update-emergency-simulation-employees',
      route: { name: 'master-data-emergency-simulation-employees-edit', params: (id) => ({ emergencySimulationEmployeeId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-emergency-simulation-employees' },
  },
})

export type { EmergencySimulationEmployee, EmergencySimulationEmployeeCreate, EmergencySimulationEmployeeUpdate } from './emergency-simulation-employees.schema'
