import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { rootCausesSchema } from './root-causes.schema'

const api = createHonoResourceActions(rpc['root-causes'], dataAdapter)
const fields = defineFields(rootCausesSchema, {
  name: { form: { renderer: 'text' } },
  code: { table: { sortable: true }, form: { renderer: 'text' } },
  description: { form: { renderer: 'textarea' } },
  active: { form: { renderer: 'switch' } },
})

export const rootCauses = defineResource(rootCausesSchema, {
  key: 'root-causes',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'view-root-causes',
      route: { name: 'master-data-root-causes' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'view-root-causes',
      route: { name: 'master-data-root-causes-detail', params: (id) => ({ rootCauseId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'manage-root-causes',
      route: { name: 'master-data-root-causes-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'manage-root-causes',
      route: { name: 'master-data-root-causes-edit', params: (id) => ({ rootCauseId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'manage-root-causes' },
  },
})
