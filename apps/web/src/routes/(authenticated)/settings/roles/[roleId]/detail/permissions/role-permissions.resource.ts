import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { loadRolePermissions, type RolePermission } from './role-permissions.operations'

export const rolePermissionFields = defineFields<RolePermission>()({ name: { label: 'Permission' } })

export const rolePermissions = defineResource({
  key: 'role-permissions',
  fields: rolePermissionFields,
  capabilities: { list: { handler: async ({ searchParameters }: { searchParameters: Record<string, unknown> }) => loadRolePermissions(String(searchParameters.role_id ?? '')), permission: 'roles.update', to: { name: 'settings-roles-detail-permissions' } } },
})
