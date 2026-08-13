import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { projectVendorActions } from './project-vendors.actions'
import { projectVendorsSchema } from './project-vendors.schema'

const fields = defineFields(projectVendorsSchema, {
  name: { table: { sortable: true } },
})

export const projectVendorLookup = defineResource(projectVendorsSchema, {
  key: 'project-vendors',
  actions: {
    list: {
      run: projectVendorActions.lookupList,
      fields: [fields.name],
      permission: 'view-project-vendors',
    },
    detail: {
      run: projectVendorActions.detail,
      fields: [fields.name],
      permission: 'view-project-vendors',
    },
  },
})

export function projectVendors(projectId: string) {
  return defineResource(projectVendorsSchema, {
    key: `project-vendors.${projectId}`,
    actions: {
      list: {
        run: projectVendorActions.list(projectId),
        fields: [fields.name],
        permission: 'view-project-vendors',
        route: { name: 'master-data-projects-detail-vendors', params: { projectId } },
      },
      detail: {
        run: projectVendorActions.detail,
        fields: [fields.name],
        permission: 'view-project-vendors',
        route: { name: 'master-data-projects-detail-vendors-detail', params: (id) => ({ projectId, projectVendorId: String(id) }) },
      },
      create: {
        run: projectVendorActions.create(projectId),
        fields: [fields.name],
        initialData: { projectId },
        permission: 'create-project-vendors',
        route: { name: 'master-data-projects-detail-vendors-create', params: { projectId } },
      },
      update: {
        run: projectVendorActions.update(projectId),
        fields: [fields.name],
        permission: 'update-project-vendors',
        route: { name: 'master-data-projects-detail-vendors-edit', params: (id) => ({ projectId, projectVendorId: String(id) }) },
      },
      delete: { run: projectVendorActions.delete, permission: 'delete-project-vendors' },
    },
  })
}
