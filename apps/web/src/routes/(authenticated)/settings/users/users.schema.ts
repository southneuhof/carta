import { defineSchema, fromZod } from '@southneuhof/loom'
import { createUserSchema } from '@southneuhof/api/routes/users/users.create.contract'
import { user, userPublicSchema } from '@southneuhof/api/routes/users/users.entity'
import { z } from 'zod/v4'
import type { AppResourceContract } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

export type User = z.output<typeof userPublicSchema>

const roleSelection = z.union([
  z.string().trim().min(1),
  z
    .object({ id: z.string().trim().min(1) })
    .passthrough()
    .transform(({ id }) => id),
])

export const createUserFormSchema = createUserSchema.extend({
  roleIds: z
    .array(roleSelection)
    .min(1)
    .superRefine((ids, context) => {
      if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Roles must be unique.' })
    }),
})

export const usersSchema = defineSchema<AppResourceContract<typeof rpc.users>>({
  identity: 'id',
  record: { schema: fromZod(userPublicSchema) },
  create: { schema: fromZod(createUserFormSchema) },
  update: { schema: fromZod(user.schemas.update) },
})
