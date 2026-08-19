import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { roles } from '../roles/roles.resource'
import { usersActions } from './users.actions'
import { usersSchema } from './users.schema'

const fields = defineFields(usersSchema, {
  name: { label: 'Name', form: { renderer: 'text' } },
  username: { label: 'Username', form: { renderer: 'text' } },
  email: { label: 'Email', form: { renderer: 'text', props: { type: 'email', required: true } } },
  password: { label: 'Password', form: { renderer: 'text', props: { type: 'password', required: true } } },
  imgPhotoUser: { label: 'Photo Key', form: { renderer: 'text' } },
  systemRoleIds: {
    label: 'System Roles',
    form: { renderer: 'checkbox-group', source: roles, props: { pick: 'id', view: 'name', required: true, searchParameters: { active: true, realm: 'system' } } },
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
      fields: [fields.name, fields.username, fields.email, fields.statusCode, fields.createdAt],
      permission: 'view-users',
      route: { name: 'settings-users' },
    },
    detail: {
      run: usersActions.detail,
      fields: [fields.name, fields.username, fields.email, fields.statusCode, fields.createdAt, fields.updatedAt],
      permission: 'view-users',
      route: { name: 'settings-users-detail', params: (id) => ({ userId: String(id) }) },
    },
    create: {
      run: usersActions.create,
      fields: [fields.name, fields.email, fields.username, fields.password, fields.imgPhotoUser, fields.systemRoleIds],
      permission: 'create-users',
      route: { name: 'settings-users-create' },
    },
    update: {
      run: usersActions.update,
      fields: [fields.name, fields.username, fields.imgPhotoUser, fields.statusCode],
      permission: 'update-users',
      route: { name: 'settings-users-edit', params: (id) => ({ userId: String(id) }) },
    },
  },
})
