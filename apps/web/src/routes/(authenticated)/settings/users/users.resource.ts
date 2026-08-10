import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { userOperations, type User, type UserUpdate } from './users.operations'

export const userFields = defineFields<User, UserUpdate>()({
  name: { label: 'Name', table: { sortable: true }, form: { renderer: 'text' } },
  email: { label: 'Email', table: { sortable: true }, form: false },
  username: { label: 'Username', table: { sortable: true }, form: { renderer: 'text' } },
  statusCode: { label: 'Status', form: { renderer: 'text' } },
})

const userCapabilities = {
  list: { handler: userOperations.list, permission: 'view-users', to: { name: 'settings-users' } },
  detail: { handler: userOperations.detail, permission: 'view-users', to: { name: 'settings-users-detail', params: (id: string) => ({ userId: id }) } },
  update: { handler: userOperations.update, permission: 'update-users', to: { name: 'settings-users-edit', params: (id: string) => ({ userId: id }) } },
} as const

export const users = defineResource<typeof userCapabilities, User, Record<string, never>, Record<string, never>, UserUpdate>({
  key: 'users',
  fields: userFields,
  table: { fields: ['name', 'username', 'email', 'statusCode', 'createdAt'] },
  detail: { fields: ['name', 'username', 'email', 'statusCode', 'createdAt', 'updatedAt'] },
  form: { fields: ['name', 'username', 'statusCode'] },
  schemas: { update: fromZod<UserUpdate>(user.schemas.update) },
  capabilities: userCapabilities,
})

export type { User, UserUpdate }
