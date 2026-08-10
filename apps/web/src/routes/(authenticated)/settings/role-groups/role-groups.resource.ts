import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { roleGroup } from '@southneuhof/api/routes/roles/roles.entity'
import { roleGroupOperations, type RoleGroup, type RoleGroupCreate, type RoleGroupUpdate } from './role-groups.operations'

const capabilities = {
  list: { handler: roleGroupOperations.list, permission: 'view-role-groups', to: { name: 'settings-role-groups' } },
  create: { handler: roleGroupOperations.create, permission: 'manage-role-groups', to: { name: 'settings-role-groups-create' } },
  detail: { handler: roleGroupOperations.detail, permission: 'view-role-groups', to: { name: 'settings-role-groups-detail', params: (id: string) => ({ roleGroupId: id }) } },
  update: { handler: roleGroupOperations.update, permission: 'manage-role-groups', to: { name: 'settings-role-groups-edit', params: (id: string) => ({ roleGroupId: id }) } },
  delete: { handler: roleGroupOperations.delete, permission: 'manage-role-groups' },
} as const
export const roleGroups = defineResource<typeof capabilities, RoleGroup, Record<string, never>, RoleGroupCreate, RoleGroupUpdate>({
  key: 'role-groups',
  fields: defineFields<RoleGroup, RoleGroupCreate>()({
    roleGroupCode: { label: 'Role Group', form: { renderer: 'text' } },
    name: { label: 'Name', form: { renderer: 'text' } },
    active: { label: 'Active', form: { renderer: 'checkbox' } },
  }),
  table: { fields: ['roleGroupCode', 'name', 'active'] },
  form: { fields: ['roleGroupCode', 'name', 'description', 'active'] },
  schemas: { create: fromZod<RoleGroupCreate>(roleGroup.schemas.create), update: fromZod<RoleGroupUpdate>(roleGroup.schemas.update) },
  capabilities,
})
