import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { permissionsActions } from './permissions.actions'
import { permissionsSchema, type Permission } from './permissions.schema'

const realmLabel = (value: unknown) => (value === 'system' ? 'System' : value === 'project' ? 'Project' : value)

const fields = defineFields(permissionsSchema, {
  permissionCode: { label: 'Code' },
  name: { label: 'Name' },
  module: { label: 'Module', read: (record: Permission) => record.module.name },
  realm: { label: 'Realm', read: (record: Permission) => realmLabel(record.module.realm) },
  description: { label: 'Description' },
  active: { label: 'Active' },
})

export const permissionResource = defineResource(permissionsSchema, {
  key: 'permissions',
  actions: {
    list: {
      run: permissionsActions.list,
      fields: [fields.permissionCode, fields.name, fields.module, fields.realm, fields.description, fields.active],
      permission: 'view-permissions',
      route: { name: 'settings-permissions' },
    },
    detail: {
      run: permissionsActions.detail,
      fields: [fields.permissionCode, fields.name, fields.module, fields.realm, fields.description, fields.active],
      permission: 'view-permissions',
      route: { name: 'settings-permissions-detail', params: (id) => ({ permissionId: String(id) }) },
    },
  },
})
