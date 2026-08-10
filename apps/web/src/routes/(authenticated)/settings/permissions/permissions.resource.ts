import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { permission } from '@southneuhof/api/routes/roles/roles.entity'
import { permissionOperations, type Permission, type PermissionCreate, type PermissionUpdate } from './permissions.operations'

const capabilities = {
  list: { handler: permissionOperations.list, permission: 'view-permissions', to: { name: 'settings-permissions' } },
  create: { handler: permissionOperations.create, permission: 'manage-permissions', to: { name: 'settings-permissions-create' } },
  detail: { handler: permissionOperations.detail, permission: 'view-permissions', to: { name: 'settings-permissions-detail', params: (id: string) => ({ permissionId: id }) } },
  update: { handler: permissionOperations.update, permission: 'manage-permissions', to: { name: 'settings-permissions-edit', params: (id: string) => ({ permissionId: id }) } },
  delete: { handler: permissionOperations.delete, permission: 'manage-permissions' },
} as const
export const permissionResource = defineResource<typeof capabilities, Permission, Record<string, never>, PermissionCreate, PermissionUpdate>({
  key: 'permissions',
  fields: defineFields<Permission, PermissionCreate>()({
    permissionCode: { label: 'Permission', form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    permissionGroup: { label: 'Group', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['permissionCode', 'name', 'permissionGroup', 'active'] },
  form: { fields: ['permissionCode', 'name', 'permissionGroup', 'description', 'active'] },
  schemas: { create: fromZod<PermissionCreate>(permission.schemas.create), update: fromZod<PermissionUpdate>(permission.schemas.update) },
  capabilities,
})
