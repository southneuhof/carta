import { defineRoute } from '@southneuhof/sprindle'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../../../../db'
import { requireOrgIdentity, requirePermission } from '../../../../../../identity'
import { setRoleAssignment } from '../../../../roles/roles.service'
import { users } from '../../../users.entity'

const change = (active: boolean) => async (args: Parameters<Parameters<typeof defineRoute>[0]['action']>[0]) => {
  const found = (await getDb().select({ id: users.id }).from(users).where(eq(users.id, args.params.userId)).limit(1))[0]
  if (!found) return args.c.json({ error: 'not_found' }, 404)
  return { data: await setRoleAssignment((await requireOrgIdentity(args)).userId, args.params.userId, args.params.roleId, active) }
}

export const PUT = defineRoute({ authorize: requirePermission('create-role-assignments'), action: change(true) })
export const DELETE = defineRoute({ authorize: requirePermission('delete-role-assignments'), action: change(false) })
