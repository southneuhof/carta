import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { uomsSchema } from './uoms.schema'

const api = createHonoResourceActions(rpc.uoms, dataAdapter)
const fields = defineFields(uomsSchema, {
  name: { label: 'Name', form: { renderer: 'text' } },
  active: { label: 'Active', form: { renderer: 'switch' } },
})

export const uoms = defineResource(uomsSchema, {
  key: 'uoms',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.active],
      permission: 'view-uoms',
      route: { name: 'master-data-uoms' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.active],
      permission: 'view-uoms',
      route: { name: 'master-data-uoms-detail', params: (id) => ({ uomId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.active],
      permission: 'create-uoms',
      route: { name: 'master-data-uoms-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.active],
      permission: 'update-uoms',
      route: { name: 'master-data-uoms-edit', params: (id) => ({ uomId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-uoms' },
  },
})
