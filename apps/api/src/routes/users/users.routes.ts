import { created, isHttpError, unauthorized } from '@southneuhof/sprindle'
import { defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'
import type { TypedResponse } from 'hono'
import { eq } from 'drizzle-orm'
import { assignInitialRoles, validateInitialRoles } from '../roles/roles.service'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { createAuth } from '../auth/auth'
import { users } from './users.entity'
import { user, userPublicSchema } from './users.entity'
import { createUserSchema, type CreateUserInput } from './users.create.contract'
import { readJsonBody } from '../../request-body'
import { z } from 'zod/v4'
import { publicRecord } from '../../storage/assets'

type CreateUserOutput =
  | TypedResponse<{ data: z.output<typeof userPublicSchema> }, 201, 'json'>
  | TypedResponse<{ error: string; message?: string }, 400 | 409 | 422, 'json'>

export const createUser = defineRoute<CreateUserOutput, ModelRuntimeContext, 'post', { json: CreateUserInput }>({
  method: 'post',
  authorize: [requirePermission('create-users')],
  action: async (args) => {
    const input = createUserSchema.parse(await readJsonBody(args.c))
    const identity = await orgIdentity(args)
    if (!identity) throw unauthorized()
    const existing = await getDb().select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1)
    if (existing[0]) return args.c.json({ error: 'email_exists' }, 409)

    let userId: string | undefined
    try {
      await validateInitialRoles(input.roleIds)
      const result = await createAuth({ allowSignUp: true }).api.signUpEmail({
        body: { name: input.name, email: input.email, password: input.password },
      })
      userId = result.user?.id
      if (!userId) return args.c.json({ error: 'user_create_failed' }, 422)
      const updated = await getDb().select().from(users).where(eq(users.id, userId)).limit(1)
      await assignInitialRoles(identity.userId, userId, input.roleIds)
      const createdUser = user.schemas.select.parse(updated[0] ?? result.user)
      return created(args.c, publicRecord(userPublicSchema, createdUser))
    } catch (error) {
      if (userId) {
        await getDb().delete(users).where(eq(users.id, userId))
      }
      if (isHttpError(error)) return args.c.json({ error: error.code, ...(error.message ? { message: error.message } : {}) }, error.status as 400)
      return args.c.json({ error: 'user_create_failed' }, 409)
    }
  },
})
