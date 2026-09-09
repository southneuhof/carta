import { defineRoute } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../../identity'
import { listRolePermissions } from '../../../../roles/roles.service'

export const GET = defineRoute({ authorize: requirePermission('list-role-permissions'), action: async (args) => {
  const data = await listRolePermissions(args.params.roleId)
  return { data, total: data.length }
} })
