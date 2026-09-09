import { defineRoute } from '@southneuhof/sprindle'
import { requireOrgIdentity, requirePermission } from '../../../../../../identity'
import { setRolePermission } from '../../../roles.service'

const change = (active: boolean) => async (args: Parameters<Parameters<typeof defineRoute>[0]['action']>[0]) => ({
  data: await setRolePermission((await requireOrgIdentity(args)).userId, args.params.roleId, args.params.permissionId, active),
})

export const PUT = defineRoute({ authorize: requirePermission('create-role-permissions'), action: change(true) })
export const DELETE = defineRoute({ authorize: requirePermission('delete-role-permissions'), action: change(false) })
