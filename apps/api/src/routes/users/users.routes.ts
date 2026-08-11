import { isHttpError, unauthorized } from '@southneuhof/sprindle'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { eq } from 'drizzle-orm'
import { assignInitialSystemRoles, validateInitialSystemRoles } from '../../authorization'
import { getDb } from '../../db'
import { orgIdentity, requirePermission } from '../../identity'
import { createAuth } from '../auth/auth'
import { users } from './users.entity'
import { createUserSchema } from './users.create.contract'

export const createUser = defineRoute({
  path: '/users/create',
  method: 'post',
  authorize: [authenticated(), requirePermission('create-users')],
  action: async (args) => {
    const input = createUserSchema.parse(await args.c.req.json().catch(() => ({})))
    const identity = await orgIdentity(args)
    if (!identity) throw unauthorized()
    const existing = await getDb().select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1)
    if (existing[0]) return args.c.json({ error: 'username_exists' }, 409)

    let userId: string | undefined
    try {
      await validateInitialSystemRoles(input.systemRoleIds)
      const result = await createAuth({ allowSignUp: true }).api.signUpEmail({
        body: { name: input.name, email: input.email, password: input.password },
      })
      userId = result.user?.id
      if (!userId) return args.c.json({ error: 'user_create_failed' }, 422)
      const updated = await getDb().update(users).set({
        username: input.username,
        imgPhotoUser: input.imgPhotoUser ?? null,
      }).where(eq(users.id, userId)).returning()
      await assignInitialSystemRoles(identity.userId, userId, input.systemRoleIds)
      return args.c.json({ data: updated[0] ?? result.user }, 201)
    } catch (error) {
      if (userId) {
        await getDb().delete(users).where(eq(users.id, userId))
      }
      if (isHttpError(error)) return args.c.json({ error: error.code, ...(error.message ? { message: error.message } : {}) }, error.status as 400)
      return args.c.json({ error: 'user_create_failed' }, 409)
    }
  },
})
