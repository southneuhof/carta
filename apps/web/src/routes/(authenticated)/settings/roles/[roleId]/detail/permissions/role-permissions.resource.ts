import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { loadRolePermissions, type RolePermission } from './role-permissions.operations'

export const rolePermissionFields = defineFields<RolePermission>()({ permissionCode: { label: 'Permission' }, name: { label: 'Name' } })

export const rolePermissions = defineResource({
  key: 'role-permissions',
  fields: rolePermissionFields,
  capabilities: { list: { handler: async ({ searchParameters }: { searchParameters: Record<string, unknown> }) => loadRolePermissions(String(searchParameters.role_id ?? '')), permission: 'manage-role-permissions', to: { name: 'settings-roles-detail-permissions' } } },
})
