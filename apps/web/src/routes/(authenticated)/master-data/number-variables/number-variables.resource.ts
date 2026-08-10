import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { numberVariableOperations, type NumberVariable } from './number-variables.operations'

export const numberVariables = defineResource({
  key: 'number-variables',
  fields: defineFields<NumberVariable>()({
    code: { table: { sortable: true } },
    name: {},
    description: {},
    active: {},
  }),
  table: { fields: ['code', 'name', 'active'] },
  detail: { fields: ['code', 'name', 'description', 'active'] },
  capabilities: {
    list: { handler: numberVariableOperations.list, permission: 'view-number-variables', to: { name: 'master-data-number-variables' } },
    detail: { handler: numberVariableOperations.detail, permission: 'view-number-variables', to: { name: 'master-data-number-variables-detail', params: (id: string) => ({ numberVariableId: id }) } },
  },
})
