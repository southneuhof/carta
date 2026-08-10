import { createHonoResourceOperations } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import type { z } from 'zod/v4'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { createUser, type CreateUserInput } from './create.operations'

export type { CreateUserInput } from './create.operations'

const userTransport = createHonoResourceOperations(rpc.users, dataAdapter)
export const userOperations = defineResourceOperations<User, Record<string, never>, CreateUserInput, UserUpdate>()({
  list: userTransport.list,
  detail: userTransport.detail,
  create: createUser,
  update: userTransport.update,
})
export type User = z.output<typeof user.schemas.select>
export type UserUpdate = z.input<typeof user.schemas.update>
