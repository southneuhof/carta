import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { uom } from '@southneuhof/api/routes/uoms/uoms.entity'
import { uomOperations, type Uom, type UomCreate, type UomUpdate } from './uoms.operations'

export const uoms = defineResource({
  key: 'uoms',
  fields: defineFields<Uom, UomCreate>()({
    name: {},
    active: {},
  }),
  table: { fields: ['name', 'active'] },
  detail: { fields: ['name', 'active'] },
  form: { fields: ['name', 'active'] },
  schemas: { create: fromZod<UomCreate>(uom.schemas.create), update: fromZod<UomUpdate>(uom.schemas.update) },
  capabilities: {
    list: { handler: uomOperations.list, permission: 'view-uoms', to: { name: 'master-data-uoms' } },
    create: { handler: uomOperations.create, permission: 'manage-uoms', to: { name: 'master-data-uoms-create' } },
    detail: { handler: uomOperations.detail, permission: 'view-uoms', to: { name: 'master-data-uoms-detail', params: (id: string) => ({ uomId: id }) } },
    update: { handler: uomOperations.update, permission: 'manage-uoms', to: { name: 'master-data-uoms-edit', params: (id: string) => ({ uomId: id }) } },
    delete: { handler: uomOperations.delete, permission: 'manage-uoms' },
  },
})
