import { defineRoute } from '@southneuhof/sprindle'
import { authRoutes } from '../../../auth/auth'

export const GET = defineRoute(authRoutes.getSession)
