import { create, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { defineRoute } from '@southneuhof/sprindle/routes'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { users } from '../users/users.entity'
import { role, roles } from './roles.entity'

export const roleModel = defineModel({
  path: '/roles',
  entity: role,
  routes: {
    list: list(),
    detail: detail(),
    create: create(),
    update: update(),
    delete: defineRoute({
      method: 'delete',
      path: '/:id',
      kind: 'delete',
      action: async ({ c }) => {
        const id = c.req.param('id')
        if (!id) return c.json({ error: 'not_found' }, 404)
        const assignedUser = await getDb().select().from(users).where(eq(users.roleId, id)).limit(1)
        if (assignedUser[0]) return c.json({ error: 'role_in_use', message: 'Role masih dipakai oleh pengguna.' }, 409)
        const deleted = await getDb().delete(roles).where(eq(roles.id, id)).returning()
        return deleted[0] ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404)
      },
    }),
  },
})
