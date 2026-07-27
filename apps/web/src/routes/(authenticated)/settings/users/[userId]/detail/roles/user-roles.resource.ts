import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { loadUserRoles, type UserRole } from './user-roles.operations'

export const userRoleFields = defineFields<UserRole>()({ name: { label: 'Role' }, assigned: { label: 'Aktif' } })

export const userRoles = defineResource({
  key: 'user-roles',
  fields: userRoleFields,
  operations: { list: async ({ searchParameters }) => loadUserRoles(String(searchParameters.user_id ?? '')) },
  actions: { list: { permission: 'users.update', to: { name: 'settings-users-detail-roles' } } },
})
