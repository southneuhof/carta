import { domain as auth } from './routes/auth/auth'
import { domain as roles } from './routes/roles/roles'
import { domain as users } from './routes/users/users'

export const domains = [auth, roles, users] as const
