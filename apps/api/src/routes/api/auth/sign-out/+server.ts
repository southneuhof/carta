import { defineRoute } from '@southneuhof/sprindle'
import { getAuth } from '../../../auth/auth'

export const POST = defineRoute({ action: async ({ c }) => getAuth().handler(c.req.raw) })
