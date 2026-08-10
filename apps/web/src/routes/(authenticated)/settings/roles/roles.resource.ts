import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { role } from '@southneuhof/api/routes/roles/roles.entity'
import { roleOperations, type Role, type RoleCreate, type RoleUpdate } from './roles.operations'

export const roleFields = defineFields<Role, RoleCreate>()({
  roleCode: { label: 'Role Code', table: { sortable: true }, form: { renderer: 'text' } },
  name: { label: 'Role Name', table: { sortable: true }, form: { renderer: 'text' } },
  assignmentScope: { label: 'Assignment Scope', form: { renderer: 'text' } },
})

const roleCapabilities = {
  list: { handler: roleOperations.list, permission: 'view-roles', to: { name: 'settings-roles' } },
  create: { handler: roleOperations.create, permission: 'manage-roles', to: { name: 'settings-roles-create' } },
  detail: { handler: roleOperations.detail, permission: 'view-roles', to: { name: 'settings-roles-detail', params: (id: string) => ({ roleId: id }) } },
  update: { handler: roleOperations.update, permission: 'manage-roles', to: { name: 'settings-roles-edit', params: (id: string) => ({ roleId: id }) } },
  delete: { handler: roleOperations.delete, permission: 'manage-roles' },
} as const

export const roles = defineResource<typeof roleCapabilities, Role, Record<string, never>, RoleCreate, RoleUpdate>({
  key: 'roles',
  fields: roleFields,
  table: { fields: ['roleCode', 'name', 'assignmentScope', 'active'] },
  detail: { fields: ['roleCode', 'name', 'assignmentScope', 'active', 'createdAt'] },
  form: { fields: ['roleCode', 'name', 'assignmentScope', 'active'] },
  schemas: { create: fromZod<RoleCreate>(role.schemas.create), update: fromZod<RoleUpdate>(role.schemas.update) },
  capabilities: roleCapabilities,
})

export type { Role, RoleCreate, RoleUpdate }
