import { domain as auth } from './routes/auth/auth'
import { domain as roles } from './routes/(authenticated)/roles/roles'
import { domain as users } from './routes/(authenticated)/users/users'

export const domains = [auth, roles, users] as const
