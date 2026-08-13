import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { businessCategoriesSchema } from './business-categories.schema'

const api = createHonoResourceActions(rpc['business-categories'], dataAdapter)
const fields = defineFields(businessCategoriesSchema, {
  name: { form: { renderer: 'text' } },
  code: { table: { sortable: true }, form: { renderer: 'text' } },
  description: { form: { renderer: 'textarea' } },
  active: { form: { renderer: 'switch' } },
})

export const businessCategories = defineResource(businessCategoriesSchema, {
  key: 'business-categories',
  actions: {
    list: {
      run: api.list,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'view-business-categories',
      route: { name: 'master-data-business-categories' },
    },
    detail: {
      run: api.detail,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'view-business-categories',
      route: { name: 'master-data-business-categories-detail', params: (id) => ({ businessCategoryId: String(id) }) },
    },
    create: {
      run: api.create,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'create-business-categories',
      route: { name: 'master-data-business-categories-create' },
    },
    update: {
      run: api.update,
      fields: [fields.name, fields.code, fields.description, fields.active],
      permission: 'update-business-categories',
      route: { name: 'master-data-business-categories-edit', params: (id) => ({ businessCategoryId: String(id) }) },
    },
    delete: { run: api.delete, permission: 'delete-business-categories' },
  },
})

export type { BusinessCategory, BusinessCategoryCreate, BusinessCategoryUpdate } from './business-categories.schema'
