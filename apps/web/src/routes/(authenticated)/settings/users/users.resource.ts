import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { createUserSchema } from '@southneuhof/api/routes/users/users.create.contract'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { z } from 'zod/v4'
import { roles } from '../roles/roles.resource'
import { userOperations, type CreateUserInput, type User, type UserUpdate } from './users.operations'

const createOnly = { visible: ({ context }: { context: Record<string, unknown> }) => context.operation !== 'update' }
const updateOnly = { visible: ({ context }: { context: Record<string, unknown> }) => context.operation === 'update' }

const systemRoleSelection = z.union([
  z.string().trim().min(1),
  z.object({ id: z.string().trim().min(1) }).passthrough().transform(({ id }) => id),
])
const createFormSchema = createUserSchema.extend({
  systemRoleIds: z.array(systemRoleSelection).min(1).superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'System roles must be unique.' })
  }),
})

export const userFields = defineFields<User, CreateUserInput>()({
  name: { label: 'Name', form: { renderer: 'text' } },
  email: { label: 'Email', form: { renderer: 'text', props: { type: 'email', required: true }, behavior: createOnly } },
  username: { label: 'Username', form: { renderer: 'text' } },
  statusCode: { label: 'Status', form: { renderer: 'radio', behavior: updateOnly } },
  password: { label: 'Password', form: { renderer: 'text', props: { type: 'password', required: true }, behavior: createOnly } },
  imgPhotoUser: { label: 'Photo Key', form: { renderer: 'text' } },
  systemRoleIds: {
    label: 'System Roles',
    form: {
      renderer: 'checkbox-group',
      source: roles,
      props: { pick: 'id', view: 'name', required: true, searchParameters: { active: true, realm: 'system' } },
      behavior: createOnly,
    },
  },
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
  form: { fields: ['name', 'email', 'username', 'password', 'imgPhotoUser', 'systemRoleIds', 'statusCode'] },
  schemas: { create: fromZod<CreateUserInput>(createFormSchema), update: fromZod<UserUpdate>(user.schemas.update) },
  capabilities: userCapabilities,
})

export type { User, UserUpdate }
