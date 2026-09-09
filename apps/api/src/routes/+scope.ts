import { defineScope } from '@southneuhof/sprindle'
import { getAuth } from './auth/auth'

export default defineScope({
  identity: (args) => getAuth().api.getSession({ headers: args.c.req.raw.headers }),
})
