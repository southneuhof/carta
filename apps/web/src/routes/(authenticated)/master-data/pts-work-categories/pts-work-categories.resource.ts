import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { ptsWorkCategoriesSchema } from './pts-work-categories.schema'

const api = createHonoResourceActions(rpc['pts-work-categories'], dataAdapter)
const fields = defineFields(ptsWorkCategoriesSchema, {
  name: { form: { renderer: 'text' } },
  active: { form: { renderer: 'switch' } },
})

export const ptsWorkCategories = defineResource(ptsWorkCategoriesSchema, {
  key: 'pts-work-categories',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.active],
      permission: 'view-pts-work-categories',
      route: { name: 'master-data-pts-work-categories' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.active],
      permission: 'view-pts-work-categories',
      route: { name: 'master-data-pts-work-categories-detail', params: (id) => ({ ptsWorkCategoryId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.active],
      permission: 'create-pts-work-categories',
      route: { name: 'master-data-pts-work-categories-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.active],
      permission: 'update-pts-work-categories',
      route: { name: 'master-data-pts-work-categories-edit', params: (id) => ({ ptsWorkCategoryId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-pts-work-categories' },
  },
})
