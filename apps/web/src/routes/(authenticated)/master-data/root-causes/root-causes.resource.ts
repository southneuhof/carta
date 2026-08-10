import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { rootCause } from '@southneuhof/api/routes/root-causes/root-causes.entity'
import { rootCauseOperations, type RootCause, type RootCauseCreate, type RootCauseUpdate } from './root-causes.operations'

export const rootCauses = defineResource({
  key: 'root-causes',
  fields: defineFields<RootCause, RootCauseCreate>()({
    name: {},
    code: { table: { sortable: true } },
    description: {},
    active: {},
  }),
  table: { fields: ['name', 'code', 'description', 'active'] },
  detail: { fields: ['name', 'code', 'description', 'active'] },
  form: { fields: ['name', 'code', 'description', 'active'] },
  schemas: { create: fromZod<RootCauseCreate>(rootCause.schemas.create), update: fromZod<RootCauseUpdate>(rootCause.schemas.update) },
  capabilities: {
    list: { handler: rootCauseOperations.list, permission: 'view-root-causes', to: { name: 'master-data-root-causes' } },
    create: { handler: rootCauseOperations.create, permission: 'manage-root-causes', to: { name: 'master-data-root-causes-create' } },
    detail: { handler: rootCauseOperations.detail, permission: 'view-root-causes', to: { name: 'master-data-root-causes-detail', params: (id: string) => ({ rootCauseId: id }) } },
    update: { handler: rootCauseOperations.update, permission: 'manage-root-causes', to: { name: 'master-data-root-causes-edit', params: (id: string) => ({ rootCauseId: id }) } },
    delete: { handler: rootCauseOperations.delete, permission: 'manage-root-causes' },
  },
})
