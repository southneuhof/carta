import { defineFields, defineResource } from '@southneuhof/loom'
import { permissionsActions } from './permissions.actions'
import { permissionsSchema } from './permissions.schema'

const fields = defineFields(permissionsSchema, {
  permissionCode: { label: 'Code' },
  name: { label: 'Name' },
  description: { label: 'Description' },
})

export const permissionResource = defineResource(permissionsSchema, {
  key: 'permissions',
  actions: {
    list: {
      run: permissionsActions.list,
      fields: [fields.permissionCode, fields.name, fields.description, 'active'],
      permission: 'view-permissions',
      route: { name: 'settings-permissions' },
    },
    detail: {
      run: permissionsActions.detail,
      fields: [fields.permissionCode, fields.name, fields.description, 'active'],
      permission: 'view-permissions',
      route: { name: 'settings-permissions-detail', params: (id) => ({ permissionId: String(id) }) },
      title: 'Permission',
    },
  },
})
