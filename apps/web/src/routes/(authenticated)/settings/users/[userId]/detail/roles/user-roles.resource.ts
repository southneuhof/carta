import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { loadUserRoles, type UserRole } from './user-roles.operations'

export const userRoleFields = defineFields<UserRole>()({ name: { label: 'Role' }, assigned: { label: 'Aktif' } })

export const userRoles = defineResource({
  key: 'user-roles',
  fields: userRoleFields,
  capabilities: { list: { handler: async ({ searchParameters }) => loadUserRoles(String(searchParameters.user_id ?? '')), permission: 'manage-user-roles', to: { name: 'settings-users-detail-roles' } } },
})
