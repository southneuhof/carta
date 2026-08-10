import { defineFields, defineResource, fromZod as frameworkFromZod } from '@southneuhof/is-vue-framework'
import { businessCategory } from '@southneuhof/api/routes/business-categories/business-categories.entity'
import { businessCategoryOperations, type BusinessCategory, type BusinessCategoryCreate, type BusinessCategoryUpdate } from './business-categories.operations'

function fromZod<T extends object>(schema: Parameters<typeof frameworkFromZod<T>>[0]) {
  return frameworkFromZod<T>(schema)
}

export const businessCategories = defineResource({
  key: 'business-categories',
  fields: defineFields<BusinessCategory, BusinessCategoryCreate>()({
    name: {},
    code: { table: { sortable: true } },
    description: {},
    active: {},
  }),
  table: { fields: ['name', 'code', 'description', 'active'] },
  detail: { fields: ['name', 'code', 'description', 'active'] },
  form: { fields: ['name', 'code', 'description', 'active'] },
  schemas: {
    create: fromZod<BusinessCategoryCreate>(businessCategory.schemas.create),
    update: fromZod<BusinessCategoryUpdate>(businessCategory.schemas.update),
  },
  capabilities: {
    list: { handler: businessCategoryOperations.list, permission: 'view-business-categories', to: { name: 'master-data-business-categories' } },
    create: { handler: businessCategoryOperations.create, permission: 'manage-business-categories', to: { name: 'master-data-business-categories-create' } },
    detail: { handler: businessCategoryOperations.detail, permission: 'view-business-categories', to: { name: 'master-data-business-categories-detail', params: (id: string) => ({ businessCategoryId: id }) } },
    update: { handler: businessCategoryOperations.update, permission: 'manage-business-categories', to: { name: 'master-data-business-categories-edit', params: (id: string) => ({ businessCategoryId: id }) } },
    delete: { handler: businessCategoryOperations.delete, permission: 'manage-business-categories' },
  },
})
