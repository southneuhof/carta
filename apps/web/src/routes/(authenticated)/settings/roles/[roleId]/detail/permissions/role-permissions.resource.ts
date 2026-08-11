import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { roleOperations } from '../../../roles.operations'
import { loadRolePermissions, type RolePermission } from './role-permissions.operations'

export const rolePermissionFields = defineFields<RolePermission>()({
  permissionCode: { label: 'Permission code' },
  name: { label: 'Permission name' },
  module: { label: 'Module', read: (record) => record.module.name },
  description: { label: 'Description' },
  assigned: { label: 'Assigned' },
})

async function loadRolePermissionList(searchParameters: Record<string, unknown>) {
  const roleId = String(searchParameters.role_id ?? '')
  if (!roleId) return loadRolePermissions(roleId)

  const [role, result] = await Promise.all([
    roleOperations.detail({ id: roleId, searchParameters: {} }),
    loadRolePermissions(roleId),
  ])
  if (!role) throw new Error('Role not found.')
  if (result.data.some((row) => row.module.realm !== role.realm)) throw new Error('Permission catalog realm mismatch.')
  return result
}

export const rolePermissions = defineResource({
  key: 'role-permissions',
  fields: rolePermissionFields,
  table: { fields: ['permissionCode', 'name', 'module', 'description', 'assigned'] },
  capabilities: { list: { handler: ({ searchParameters }: { searchParameters: Record<string, unknown> }) => loadRolePermissionList(searchParameters), permission: 'view-role-permissions', to: { name: 'settings-roles-detail-permissions' } } },
})
