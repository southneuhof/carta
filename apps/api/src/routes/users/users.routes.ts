import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { createAuth } from '../auth/auth'
import { users } from './users.entity'
import { createUserSchema } from './users.create.contract'

export const createUser = defineRoute({
  path: '/users/create',
  method: 'post',
  authorize: [authenticated(), requirePermission('create-users')],
  action: async (args) => {
    const input = createUserSchema.parse(await args.c.req.json().catch(() => ({})))
    const existing = await getDb().select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1)
    if (existing[0]) return args.c.json({ error: 'username_exists' }, 409)
    try {
      const result = await createAuth({ allowSignUp: true }).api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
      })
      const id = result.user?.id
      if (!id) return args.c.json({ error: 'user_create_failed' }, 422)
      const updated = await getDb()
        .update(users)
        .set({
          username: input.username,
          imgPhotoUser: input.imgPhotoUser ?? null,
        })
        .where(eq(users.id, id))
        .returning()
      return args.c.json({ data: updated[0] ?? result.user }, 201)
    } catch {
      return args.c.json({ error: 'user_create_failed' }, 409)
    }
  },
})
