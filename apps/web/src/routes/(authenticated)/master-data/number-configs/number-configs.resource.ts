import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { numberConfig } from '@southneuhof/api/routes/number-configs/number-configs.entity'
import { numberVariables } from '../number-variables/number-variables.resource'
import { numberVariableOperations } from '../number-variables/number-variables.operations'
import { numberConfigOperations, type NumberConfig, type NumberConfigCreate, type NumberConfigUpdate } from './number-configs.operations'

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { code?: unknown }).code : undefined
}

const numberConfigCapabilities = {
  list: { handler: numberConfigOperations.list, permission: 'view-number-configs', to: { name: 'master-data-number-configs' } },
  create: { handler: numberConfigOperations.create, permission: 'manage-number-configs', to: { name: 'master-data-number-configs-create' } },
  detail: { handler: numberConfigOperations.detail, permission: 'view-number-configs', to: { name: 'master-data-number-configs-detail', params: (id: string) => ({ numberConfigId: id }) } },
  update: { handler: numberConfigOperations.update, permission: 'manage-number-configs', to: { name: 'master-data-number-configs-edit', params: (id: string) => ({ numberConfigId: id }) } },
  delete: { handler: numberConfigOperations.delete, permission: 'manage-number-configs' },
} as const

export const numberConfigs = defineResource<typeof numberConfigCapabilities, NumberConfig, Record<string, never>, NumberConfigCreate, NumberConfigUpdate>({
  key: 'number-configs',
  fields: defineFields<NumberConfig, NumberConfigCreate>()({
    numberVariableCode: { label: 'Number Variable', table: { sortable: true }, form: { renderer: 'lookup', source: numberVariables, props: { pick: 'code', view: 'code', required: true, loadDetail: async ({ id }: { id?: string | number }) => (await numberVariableOperations.list({ query: {}, searchParameters: { code: String(id) } })).data[0] } } },
    numberVariable: { label: 'Number Variable', read: (record: unknown) => relationName(record, 'numberVariable') },
    displayOrder: { label: 'Display Order', table: { sortable: true }, form: { renderer: 'number' } },
    numberOfDigits: { label: 'Digits', form: { renderer: 'number' } },
    customCode: { label: 'Custom Code', form: { renderer: 'text' } },
    description: {},
    active: {},
  }),
  table: { fields: ['numberVariable', 'displayOrder', 'numberOfDigits', 'active'] },
  detail: { fields: ['numberVariable', 'displayOrder', 'numberOfDigits', 'customCode', 'description', 'active'] },
  form: { fields: ['numberVariableCode', 'numberOfDigits', 'customCode', 'description', 'active'] },
  schemas: { create: fromZod<NumberConfigCreate>(numberConfig.schemas.create), update: fromZod<NumberConfigUpdate>(numberConfig.schemas.update) },
  capabilities: numberConfigCapabilities,
})
