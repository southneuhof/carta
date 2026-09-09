import { create } from '@southneuhof/sprindle'
import { roleAuthorization } from '../../../roles/roles'

export const POST = create({ authorize: roleAuthorization.create })
