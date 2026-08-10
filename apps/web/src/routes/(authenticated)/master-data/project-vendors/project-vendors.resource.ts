import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { projectVendor } from '@southneuhof/api/routes/project-vendors/project-vendors.entity'
import { projects } from '../projects/projects.resource'
import { projectVendorOperations, type ProjectVendor, type ProjectVendorCreate, type ProjectVendorUpdate } from './project-vendors.operations'

export const projectVendors = defineResource({
  key: 'project-vendors',
  fields: defineFields<ProjectVendor, ProjectVendorCreate>()({
    name: { table: { sortable: true } },
    projectId: { label: 'Project', form: { renderer: 'lookup', source: projects, props: { pick: 'id', view: 'name', required: true }, behavior: { visible: ({ context }) => context.scope !== 'project' } } },
  }),
  table: { fields: ['name'] },
  detail: { fields: ['name'] },
  form: { fields: ['projectId', 'name'] },
  schemas: { create: fromZod<ProjectVendorCreate>(projectVendor.schemas.create), update: fromZod<ProjectVendorUpdate>(projectVendor.schemas.update) },
  capabilities: {
    list: { handler: projectVendorOperations.list, permission: 'view-project-vendors', to: { name: 'master-data-project-vendors' } },
    create: { handler: projectVendorOperations.create, permission: 'manage-project-vendors', to: { name: 'master-data-project-vendors-create' } },
    detail: { handler: projectVendorOperations.detail, permission: 'view-project-vendors' },
    update: { handler: projectVendorOperations.update, permission: 'manage-project-vendors', to: { name: 'master-data-project-vendors-edit', params: (id: string) => ({ projectVendorId: id }) } },
    delete: { handler: projectVendorOperations.delete, permission: 'manage-project-vendors' },
  },
})
