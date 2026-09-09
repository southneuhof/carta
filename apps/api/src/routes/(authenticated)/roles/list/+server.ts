import { list } from '@southneuhof/sprindle'
import { roleAuthorization } from '../../../roles/roles'

export const GET = list({ authorize: roleAuthorization.list })
