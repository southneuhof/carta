import { defineRoute } from '@southneuhof/sprindle/routes'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { users } from '../users/users.entity'

const DEMO_EMAIL = 'admin@example.com'
const DEMO_PASSWORD = 'demo-password'
const DEMO_CAPABILITIES = [
  'view-user', 'show-user', 'create-user', 'update-user', 'delete-user',
  'view-role', 'show-role', 'create-role', 'update-role', 'delete-role',
]

export const loginRoute = defineRoute({
  path: '/login',
  method: 'post',
  action: async ({ c }) => {
    const input = await c.req.json<{ username?: string; password?: string }>()
    if (input.username !== DEMO_EMAIL || input.password !== DEMO_PASSWORD) {
      return c.json({ error: 'invalid_credentials', message: 'Email atau password tidak valid.' }, 401)
    }

    const user = await getDb().select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1)
    if (!user[0]) return c.json({ error: 'demo_user_missing' }, 500)
    return c.json({ user: { ...user[0], role_id: 1, fullname: user[0].name, username: user[0].email }, token: 'demo-token', tasks: DEMO_CAPABILITIES })
  },
})
