import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { rolesActions } from './roles.actions'
import { rolesSchema } from './roles.schema'

const realmOptions = [
  { id: 'system', name: 'System' },
  { id: 'project', name: 'Project' },
] as const

const realmLabel = (value: unknown) => value === 'system' ? 'System' : value === 'project' ? 'Project' : value
const fields = defineFields(rolesSchema, {
  roleCode: { label: 'Role Code', form: { renderer: 'text' } },
  name: { label: 'Role Name', form: { renderer: 'text' } },
  description: { label: 'Description', form: { renderer: 'textarea' } },
  realm: { label: 'Realm', read: (record) => realmLabel(record.realm), form: { renderer: 'radio', source: realmOptions, props: { required: true } } },
  active: { label: 'Active' },
  createdAt: { label: 'Created At' },
})

export const roles = defineResource(rolesSchema, {
  key: 'roles',
  actions: {
    list: {
      run: rolesActions.list,
      fields: [fields.roleCode, fields.name, fields.realm, fields.active],
      permission: 'view-roles',
      route: { name: 'settings-roles' },
    },
    detail: {
      run: rolesActions.detail,
      fields: [fields.roleCode, fields.name, fields.description, fields.realm, fields.active, fields.createdAt],
      permission: 'view-roles',
      route: { name: 'settings-roles-detail', params: (id) => ({ roleId: String(id) }) },
    },
    create: {
      run: rolesActions.create,
      fields: [fields.roleCode, fields.name, fields.description, fields.realm, fields.active],
      permission: 'create-roles',
      route: { name: 'settings-roles-create' },
    },
    update: {
      run: rolesActions.update,
      fields: [fields.roleCode, fields.name, fields.description, fields.realm.override({ form: { behavior: { disabled: () => true } } }), fields.active],
      permission: 'update-roles',
      route: { name: 'settings-roles-edit', params: (id) => ({ roleId: String(id) }) },
    },
    delete: { run: rolesActions.delete, permission: 'delete-roles' },
  },
})
