import { defineFields, defineResource } from '@southneuhof/loom'
import { roles } from '../roles/roles.resource'
import { usersActions } from './users.actions'
import { usersSchema } from './users.schema'

const fields = defineFields(usersSchema, {
  name: { label: 'Name', form: { renderer: 'text' } },
  email: { label: 'Email', form: { renderer: 'text', props: { type: 'email', required: true } } },
  password: { label: 'Password', form: { renderer: 'text', props: { type: 'password', required: true } } },
  roleIds: {
    label: 'Roles',
    form: { renderer: 'checkbox-group', source: roles, props: { pick: 'id', view: 'name', required: true, searchParameters: { active: true } } },
  },
  statusCode: { label: 'Status', form: { renderer: 'radio' } },
  createdAt: { label: 'Created At' },
  updatedAt: { label: 'Updated At' },
})

export const users = defineResource(usersSchema, {
  key: 'users',
  actions: {
    list: {
      run: usersActions.list,
      fields: [fields.name, fields.email, fields.statusCode, fields.createdAt],
      permission: 'view-users',
      route: { name: 'settings-users' },
    },
    detail: {
      run: usersActions.detail,
      fields: [fields.name, fields.email, fields.statusCode, fields.createdAt, fields.updatedAt],
      permission: 'view-users',
      route: { name: 'settings-users-detail', params: (id) => ({ userId: String(id) }) },
      title: 'User Detail',
    },
    create: {
      run: usersActions.create,
      fields: [fields.name, fields.email, fields.password, fields.roleIds],
      permission: 'create-users',
      route: { name: 'settings-users-create' },
    },
    update: {
      run: usersActions.update,
      fields: [fields.name, fields.statusCode],
      permission: 'update-users',
      route: { name: 'settings-users-edit', params: (id) => ({ userId: String(id) }) },
    },
  },
})
