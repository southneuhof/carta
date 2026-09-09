import { update } from '@southneuhof/sprindle'
import { roleAuthorization } from '../../../../roles/roles'

export const PATCH = update({ authorize: roleAuthorization.update })
