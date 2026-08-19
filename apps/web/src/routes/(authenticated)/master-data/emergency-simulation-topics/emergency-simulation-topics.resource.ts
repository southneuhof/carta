import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rpc } from '@/framework/rpc'
import { emergencySimulationTopicsSchema } from './emergency-simulation-topics.schema'

const api = createHonoResourceActions(rpc['emergency-simulation-topics'], dataAdapter)

const fields = defineFields(emergencySimulationTopicsSchema, {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
})

export const emergencySimulationTopics = defineResource(emergencySimulationTopicsSchema, {
  key: 'emergency-simulation-topics',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name],
      permission: 'view-emergency-simulation-topics',
      route: { name: 'master-data-emergency-simulation-topics' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name],
      permission: 'view-emergency-simulation-topics',
      route: { name: 'master-data-emergency-simulation-topics-detail', params: (id) => ({ emergencySimulationTopicId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name],
      permission: 'create-emergency-simulation-topics',
      route: { name: 'master-data-emergency-simulation-topics-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name],
      permission: 'update-emergency-simulation-topics',
      route: { name: 'master-data-emergency-simulation-topics-edit', params: (id) => ({ emergencySimulationTopicId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-emergency-simulation-topics' },
  },
})

export type { EmergencySimulationTopic, EmergencySimulationTopicCreate, EmergencySimulationTopicUpdate } from './emergency-simulation-topics.schema'

