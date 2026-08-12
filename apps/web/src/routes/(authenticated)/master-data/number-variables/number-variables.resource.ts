import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { numberVariablesSchema } from './number-variables.schema'

const api = createHonoResourceActions(rpc['number-variables'], dataAdapter)
const fields = defineFields(numberVariablesSchema, {
  code: { table: { sortable: true } },
  name: {},
  active: {},
  description: {},
})

export const numberVariables = defineResource(numberVariablesSchema, {
  key: 'number-variables',
  actions: {
    list: {
      run: api.list,
      fields: [fields.code, fields.name, fields.active],
      permission: 'view-number-variables',
      route: { name: 'master-data-number-variables' },
    },
    detail: {
      run: api.detail,
      fields: [fields.code, fields.name, fields.description, fields.active],
      permission: 'view-number-variables',
      route: { name: 'master-data-number-variables-detail', params: (id) => ({ numberVariableId: String(id) }) },
    },
  },
})
