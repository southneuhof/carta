import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { permissionOperations, type Permission } from './permissions.operations'

const realmLabel = (value: unknown) => value === 'system' ? 'System' : value === 'project' ? 'Project' : value

const capabilities = {
  list: { handler: permissionOperations.list, permission: 'view-permissions', to: { name: 'settings-permissions' } },
  detail: { handler: permissionOperations.detail, permission: 'view-permissions', to: { name: 'settings-permissions-detail', params: (id: string) => ({ permissionId: id }) } },
} as const

export const permissionResource = defineResource<typeof capabilities, Permission>({
  key: 'permissions',
  fields: defineFields<Permission>()({
    permissionCode: { label: 'Code' },
    name: { label: 'Name' },
    module: { label: 'Module', read: (record) => record.module.name },
    realm: { label: 'Realm', read: (record) => realmLabel(record.module.realm) },
    description: { label: 'Description' },
    active: { label: 'Active' },
  }),
  table: { fields: ['permissionCode', 'name', 'module', 'realm', 'description', 'active'] },
  detail: { fields: ['permissionCode', 'name', 'module', 'realm', 'description', 'active'] },
  capabilities,
})
