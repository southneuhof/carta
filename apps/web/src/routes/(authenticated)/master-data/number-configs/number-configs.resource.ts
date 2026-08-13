import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { numberVariables } from '../number-variables/number-variables.resource'
import { numberConfigsActions } from './number-configs.actions'
import { numberConfigsSchema } from './number-configs.schema'

const api = createHonoResourceActions(rpc['number-configs'], dataAdapter)

function relationName(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined
  const relation = (record as Record<string, unknown>)[key]
  return relation && typeof relation === 'object' ? (relation as { code?: unknown }).code : undefined
}

const numberVariableLookup = {
  pick: 'code',
  view: 'code',
  required: true,
  loadDetail: async ({ id }: { id?: string | number }) => (await numberVariables.list({ searchParameters: { code: String(id) } }).run({ query: {}, searchParameters: { code: String(id) } })).data[0],
}

const fields = defineFields(numberConfigsSchema, {
  numberVariable: { label: 'Number Variable', read: (record) => relationName(record, 'numberVariable') },
  numberVariableCode: { label: 'Number Variable', form: { renderer: 'lookup', source: numberVariables, props: numberVariableLookup } },
  displayOrder: { label: 'Display Order', table: { sortable: true } },
  numberOfDigits: { label: 'Digits', form: { renderer: 'number' } },
  customCode: { label: 'Custom Code', form: { renderer: 'text' } },
  description: {},
  active: { form: { renderer: 'switch' } },
})

export const numberConfigs = defineResource(numberConfigsSchema, {
  key: 'number-configs',
  actions: {
    list: {
      run: api.list,
      fields: [fields.numberVariable, fields.displayOrder, fields.numberOfDigits, fields.active],
      permission: 'view-number-configs',
      route: { name: 'master-data-number-configs' },
    },
    detail: {
      run: api.detail,
      fields: [fields.numberVariable, fields.displayOrder, fields.numberOfDigits, fields.customCode, fields.description, fields.active],
      permission: 'view-number-configs',
      route: { name: 'master-data-number-configs-detail', params: (id) => ({ numberConfigId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.numberVariableCode, fields.numberOfDigits, fields.customCode, fields.description, fields.active],
      permission: 'create-number-configs',
      route: { name: 'master-data-number-configs-create' },
    },
    update: {
      run: api.update,
      fields: [fields.numberVariableCode, fields.numberOfDigits, fields.customCode, fields.description, fields.active],
      permission: 'update-number-configs',
      route: { name: 'master-data-number-configs-edit', params: (id) => ({ numberConfigId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-number-configs' },
    reorder: {
      run: numberConfigsActions.reorder,
    },
  },
})
