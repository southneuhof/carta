import { authenticated, defineRoute, detail, list } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { requirePermission } from '../../identity'
import { sessions } from '../auth/auth.entity'
import { user, users } from './users.entity'

const updateUser = defineRoute({
  path: '/:id',
  method: 'patch',
  kind: 'update',
  authorize: [authenticated(), requirePermission('update-users')],
  action: async ({ c }) => {
    const id = c.req.param('id') ?? ''
    if (!id) return c.json({ error: 'not_found' }, 404)
    const found = (await getDb().select().from(users).where(eq(users.id, id)).limit(1))[0]
    if (!found) return c.json({ error: 'not_found' }, 404)
    const input = user.schemas.update.parse(await c.req.json().catch(() => ({})))
    const updated = await getDb().transaction(async (tx) => {
      const saved = await tx.update(users).set(input).where(eq(users.id, id)).returning()
      if (found.statusCode === 'active' && input.statusCode && input.statusCode !== 'active') {
        await tx.delete(sessions).where(eq(sessions.userId, id))
      }
      return saved[0]
    })
    return c.json({ data: updated })
  },
})

export const userModel = defineModel({
  path: '/users',
  entity: user,
  routes: {
    list: list({ authorize: [authenticated(), requirePermission('view-users')] }),
    detail: detail({ authorize: [authenticated(), requirePermission('view-users')] }),
    update: updateUser,
  },
})
