import { detail } from '@southneuhof/sprindle'
import { roleAuthorization } from '../../../../roles/roles'

export const GET = detail({ authorize: roleAuthorization.detail })
