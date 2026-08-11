import { z } from 'zod/v4'

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(160),
  username: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  imgPhotoUser: z.string().trim().max(500).nullable().optional(),
  systemRoleIds: z.array(z.string().trim().min(1)).min(1).superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'System roles must be unique.' })
  }),
})

export type CreateUserInput = z.input<typeof createUserSchema>
