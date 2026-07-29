import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { role } from '@southneuhof/api/routes/roles/roles.entity'
import { roleOperations, type Role, type RoleCreate, type RoleUpdate } from './roles.operations'

export const roleFields = defineFields<Role, RoleCreate>()({
  name: { label: 'Role Name', table: { sortable: true }, form: { renderer: 'text' } },
})

export const roles = defineResource({
  key: 'roles',
  fields: roleFields,
  table: { fields: ['name', 'createdAt'] },
  detail: { fields: ['name', 'createdAt'] },
  form: { fields: ['name'] },
  schemas: { create: fromZod<RoleCreate>(role.schemas.create), update: fromZod<RoleUpdate>(role.schemas.update) },
  capabilities: {
    list: { handler: roleOperations.list, permission: 'roles.list', to: { name: 'settings-roles' } },
    create: { handler: roleOperations.create, permission: 'roles.create', to: { name: 'settings-roles-create' } },
    detail: { handler: roleOperations.detail, permission: 'roles.detail', to: { name: 'settings-roles-detail', params: (id) => ({ roleId: id }) } },
    update: { handler: roleOperations.update, permission: 'roles.update', to: { name: 'settings-roles-edit', params: (id) => ({ roleId: id }) } },
    delete: { handler: roleOperations.delete, permission: 'roles.delete' },
  },
})

export type { Role, RoleCreate, RoleUpdate }
