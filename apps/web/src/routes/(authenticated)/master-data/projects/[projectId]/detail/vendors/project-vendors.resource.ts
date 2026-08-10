import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { projectVendor } from '@southneuhof/api/routes/project-vendors/project-vendors.entity'
import { projectVendorOperations, type ProjectVendor, type ProjectVendorCreate, type ProjectVendorUpdate } from './project-vendors.operations'

export function projectVendors(projectId: string) {
  return defineResource({
    key: 'project-vendors',
    fields: defineFields<ProjectVendor, ProjectVendorCreate>()({
      name: { table: { sortable: true } },
    }),
    table: { fields: ['name'] },
    detail: { fields: ['name'] },
    form: { fields: ['name'] },
    schemas: { create: fromZod<ProjectVendorCreate>(projectVendor.schemas.create), update: fromZod<ProjectVendorUpdate>(projectVendor.schemas.update) },
    capabilities: {
      list: { handler: projectVendorOperations.list, permission: 'view-project-vendors', to: { name: 'master-data-projects-detail-vendors', params: { projectId } } },
      create: { handler: projectVendorOperations.create, permission: 'manage-project-vendors', to: { name: 'master-data-projects-detail-vendors-create', params: { projectId } } },
      detail: { handler: projectVendorOperations.detail, permission: 'view-project-vendors', to: { name: 'master-data-projects-detail-vendors-detail', params: (id) => ({ projectId, projectVendorId: String(id) }) } },
      update: { handler: projectVendorOperations.update, permission: 'manage-project-vendors', to: { name: 'master-data-projects-detail-vendors-edit', params: (id) => ({ projectId, projectVendorId: String(id) }) } },
      delete: { handler: projectVendorOperations.delete, permission: 'manage-project-vendors' },
    },
  })
}
