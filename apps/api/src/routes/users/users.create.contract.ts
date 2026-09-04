import { z } from 'zod/v4'

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  roleIds: z.array(z.string().trim().min(1)).min(1).superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Roles must be unique.' })
  }),
})

export type CreateUserInput = z.input<typeof createUserSchema>
