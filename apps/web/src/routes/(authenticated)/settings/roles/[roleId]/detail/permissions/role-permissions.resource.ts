import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { rolePermissionsActions } from './role-permissions.actions'
import { rolePermissionsSchema } from './role-permissions.schema'

const fields = defineFields(rolePermissionsSchema, {
  permissionCode: { label: 'Permission code' },
  name: { label: 'Permission name' },
  module: { label: 'Module', read: (record) => record.module.name },
  description: { label: 'Description' },
  assigned: { label: 'Assigned' },
})

export const rolePermissions = defineResource(rolePermissionsSchema, {
  key: 'role-permissions',
  actions: {
    list: {
      run: rolePermissionsActions.list,
      fields: [fields.permissionCode, fields.name, fields.module, fields.description, fields.assigned],
      permission: 'view-role-permissions',
      route: { name: 'settings-roles-detail-permissions' },
    },
    set: { run: rolePermissionsActions.set },
  },
})
