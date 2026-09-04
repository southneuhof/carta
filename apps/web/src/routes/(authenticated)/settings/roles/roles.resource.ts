import { defineFields, defineResource } from '@southneuhof/loom'
import { rolesActions } from './roles.actions'
import { rolesSchema } from './roles.schema'

const fields = defineFields(rolesSchema, {
  roleCode: { label: 'Role Code', form: { renderer: 'text' } },
  name: { label: 'Role Name', form: { renderer: 'text' } },
  description: { label: 'Description', form: { renderer: 'textarea' } },
  createdAt: { label: 'Created At' },
})

export const roles = defineResource(rolesSchema, {
  key: 'roles',
  actions: {
    list: {
      run: rolesActions.list,
      fields: [fields.roleCode, fields.name, 'active'],
      permission: 'view-roles',
      route: { name: 'settings-roles' },
    },
    detail: {
      run: rolesActions.detail,
      fields: [fields.roleCode, fields.name, fields.description, 'active', fields.createdAt],
      permission: 'view-roles',
      route: { name: 'settings-roles-detail', params: (id) => ({ roleId: String(id) }) },
      title: 'Detail Role',
    },
    create: {
      run: rolesActions.create,
      fields: [fields.roleCode, fields.name, fields.description, 'active'],
      permission: 'create-roles',
      route: { name: 'settings-roles-create' },
    },
    update: {
      run: rolesActions.update,
      fields: [fields.roleCode, fields.name, fields.description, 'active'],
      permission: 'update-roles',
      route: { name: 'settings-roles-edit', params: (id) => ({ roleId: String(id) }) },
    },
    delete: { run: rolesActions.delete, permission: 'delete-roles' },
  },
})
