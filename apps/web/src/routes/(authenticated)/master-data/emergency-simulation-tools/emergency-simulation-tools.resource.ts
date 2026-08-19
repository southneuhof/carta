import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { emergencySimulationToolsSchema } from './emergency-simulation-tools.schema'

const api = createHonoResourceActions(rpc['emergency-simulation-tools'], dataAdapter)

const fields = defineFields(emergencySimulationToolsSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
})

export const emergencySimulationTools = defineResource(emergencySimulationToolsSchema, {
  key: 'emergency-simulation-tools',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name],
      permission: 'view-emergency-simulation-tools',
      route: { name: 'master-data-emergency-simulation-tools' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name],
      permission: 'view-emergency-simulation-tools',
      route: { name: 'master-data-emergency-simulation-tools-detail', params: (id) => ({ emergencySimulationToolId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name],
      permission: 'create-emergency-simulation-tools',
      route: { name: 'master-data-emergency-simulation-tools-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name],
      permission: 'update-emergency-simulation-tools',
      route: { name: 'master-data-emergency-simulation-tools-edit', params: (id) => ({ emergencySimulationToolId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-emergency-simulation-tools' },
  },
})

export type { EmergencySimulationTool, EmergencySimulationToolCreate, EmergencySimulationToolUpdate } from './emergency-simulation-tools.schema'

