import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { loadRolePermissions, type RolePermission } from './role-permissions.operations'

export const rolePermissionFields = defineFields<RolePermission>()({ name: { label: 'Permission' } })

export const rolePermissions = defineResource({
  key: 'role-permissions',
  fields: rolePermissionFields,
  operations: { list: async ({ searchParameters }) => loadRolePermissions(String(searchParameters.role_id ?? '')) },
  actions: { list: { permission: 'roles.update', to: { name: 'settings-roles-detail-permissions' } } },
})
