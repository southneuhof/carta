import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { createUserSchema } from '@southneuhof/api/routes/users/users.create.contract'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { userOperations, type CreateUserInput, type User, type UserUpdate } from './users.operations'

const createOnly = { visible: ({ context }: { context: Record<string, unknown> }) => context.operation !== 'update' }

export const userFields = defineFields<User, CreateUserInput>()({
  name: { label: 'Name', table: { sortable: true }, form: { renderer: 'text' } },
  email: { label: 'Email', table: { sortable: true }, form: { renderer: 'text', props: { type: 'email', required: true }, behavior: createOnly } },
  username: { label: 'Username', table: { sortable: true }, form: { renderer: 'text' } },
  statusCode: { label: 'Status' },
  password: { label: 'Password', form: { renderer: 'text', props: { type: 'password', required: true }, behavior: createOnly } },
  imgPhotoUser: { label: 'Photo Key', form: { renderer: 'text', behavior: createOnly } },
})

const userCapabilities = {
  list: { handler: userOperations.list, permission: 'view-users', to: { name: 'settings-users' } },
  create: { handler: userOperations.create, permission: 'create-users', to: { name: 'settings-users-create' } },
  detail: { handler: userOperations.detail, permission: 'view-users', to: { name: 'settings-users-detail', params: (id: string) => ({ userId: id }) } },
  update: { handler: userOperations.update, permission: 'update-users', to: { name: 'settings-users-edit', params: (id: string) => ({ userId: id }) } },
} as const

export const users = defineResource<typeof userCapabilities, User, Record<string, never>, CreateUserInput, UserUpdate>({
  key: 'users',
  fields: userFields,
  table: { fields: ['name', 'username', 'email', 'statusCode', 'createdAt'] },
  detail: { fields: ['name', 'username', 'email', 'statusCode', 'createdAt', 'updatedAt'] },
  form: { fields: ['name', 'username', 'email', 'password', 'imgPhotoUser'] },
  schemas: { create: fromZod<CreateUserInput>(createUserSchema), update: fromZod<UserUpdate>(user.schemas.update) },
  capabilities: userCapabilities,
})

export type { User, UserUpdate }
