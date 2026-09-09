import { defineRoute } from '@southneuhof/sprindle'
import { authRoutes } from '../../../auth/auth'

export const POST = defineRoute(authRoutes.signOut)
