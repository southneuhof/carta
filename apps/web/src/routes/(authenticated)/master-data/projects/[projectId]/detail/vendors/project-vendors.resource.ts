import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { projectVendorActions } from './project-vendors.actions'
import { projectVendorsSchema } from './project-vendors.schema'

const fields = defineFields(projectVendorsSchema, {
  name: { table: { sortable: true } },
})

export function projectVendors(projectId: string) {
  return defineResource(projectVendorsSchema, {
    key: `project-vendors.${projectId}`,
    actions: {
      list: {
        run: projectVendorActions.list(projectId),
        fields: [fields.name],
        permission: null,
        route: { name: 'master-data-projects-detail-vendors', params: { projectId } },
      },
      detail: {
        run: projectVendorActions.detail,
        fields: [fields.name],
        permission: null,
        route: { name: 'master-data-projects-detail-vendors-detail', params: (id) => ({ projectId, projectVendorId: String(id) }) },
      },
      create: {
        run: projectVendorActions.create(projectId),
        fields: [fields.name],
        initialData: { projectId },
        permission: null,
        route: { name: 'master-data-projects-detail-vendors-create', params: { projectId } },
      },
      update: {
        run: projectVendorActions.update(projectId),
        fields: [fields.name],
        permission: null,
        route: { name: 'master-data-projects-detail-vendors-edit', params: (id) => ({ projectId, projectVendorId: String(id) }) },
      },
      delete: { run: projectVendorActions.delete, permission: null },
    },
  })
}
