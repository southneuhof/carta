import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { userOperations, type User, type UserUpdate } from './users.operations'

export const userFields = defineFields<User, UserUpdate>()({
  name: { label: 'Nama', table: { sortable: true }, form: { renderer: 'text' } },
  email: { label: 'Email', table: { sortable: true }, form: false },
  createdAt: { label: 'Dibuat', display: { format: 'datetime' }, form: false },
  updatedAt: { label: 'Diubah', display: { format: 'datetime' }, form: false },
})

export const users = defineResource({
  key: 'users',
  fields: userFields,
  operations: userOperations,
  table: { fields: ['name', 'email', 'createdAt', 'updatedAt'] },
  detail: { fields: ['name', 'email', 'createdAt', 'updatedAt'] },
  form: { fields: ['name'] },
  schemas: { update: fromZod<UserUpdate>(user.schemas.update) },
  actions: {
    list: { permission: 'users.list', to: { name: 'settings-users' } },
    detail: { permission: 'users.detail', to: { name: 'settings-users-detail', params: (id) => ({ userId: id }) } },
    update: { permission: 'users.update', to: { name: 'settings-users-edit', params: (id) => ({ userId: id }) } },
  },
})

export type { User, UserUpdate }
