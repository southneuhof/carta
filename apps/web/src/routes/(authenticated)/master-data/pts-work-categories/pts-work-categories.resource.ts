import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { ptsWorkCategory } from '@southneuhof/api/routes/pts-work-categories/pts-work-categories.entity'
import { ptsWorkCategoryOperations, type PtsWorkCategory, type PtsWorkCategoryCreate, type PtsWorkCategoryUpdate } from './pts-work-categories.operations'

export const ptsWorkCategories = defineResource({
  key: 'pts-work-categories',
  fields: defineFields<PtsWorkCategory, PtsWorkCategoryCreate>()({
    name: {},
    active: {},
  }),
  table: { fields: ['name', 'active'] },
  detail: { fields: ['name', 'active'] },
  form: { fields: ['name', 'active'] },
  schemas: { create: fromZod<PtsWorkCategoryCreate>(ptsWorkCategory.schemas.create), update: fromZod<PtsWorkCategoryUpdate>(ptsWorkCategory.schemas.update) },
  capabilities: {
    list: { handler: ptsWorkCategoryOperations.list, permission: 'view-pts-work-categories', to: { name: 'master-data-pts-work-categories' } },
    create: { handler: ptsWorkCategoryOperations.create, permission: 'manage-pts-work-categories', to: { name: 'master-data-pts-work-categories-create' } },
    detail: { handler: ptsWorkCategoryOperations.detail, permission: 'view-pts-work-categories', to: { name: 'master-data-pts-work-categories-detail', params: (id: string) => ({ ptsWorkCategoryId: id }) } },
    update: { handler: ptsWorkCategoryOperations.update, permission: 'manage-pts-work-categories', to: { name: 'master-data-pts-work-categories-edit', params: (id: string) => ({ ptsWorkCategoryId: id }) } },
    delete: { handler: ptsWorkCategoryOperations.delete, permission: 'manage-pts-work-categories' },
  },
})
