import { defineSchema, fromZod } from '@southneuhof/is-vue-framework'
import { createUserSchema } from '@southneuhof/api/routes/users/users.create.contract'
import { user } from '@southneuhof/api/routes/users/users.entity'
import { z } from 'zod/v4'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export type User = z.output<typeof user.schemas.select>
export type UserUpdate = z.input<typeof user.schemas.update>

const systemRoleSelection = z.union([
  z.string().trim().min(1),
  z.object({ id: z.string().trim().min(1) }).passthrough().transform(({ id }) => id),
])

export const createUserFormSchema = createUserSchema.extend({
  systemRoleIds: z.array(systemRoleSelection).min(1).superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'System roles must be unique.' })
  }),
})

export const usersSchema = defineSchema<AppResourceContract<typeof rpc.users>>({
  identity: 'id',
  record: { schema: fromZod(user.schemas.select) },
  create: { schema: fromZod(createUserFormSchema) },
  update: { schema: fromZod(user.schemas.update) },
})
