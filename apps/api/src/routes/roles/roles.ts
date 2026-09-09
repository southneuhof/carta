import { isHttpError } from '@southneuhof/sprindle'
import { defineDomainPart } from '@southneuhof/sprindle/model'
import { requirePermission } from '../../identity'
import {
  permissions,
  permission,
  role,
  rolePermissions,
  roles,
  roleAssignments,
} from './roles.entity'
import { deleteUnassignedRole } from './roles.service'

export const roleAuthorization = {
  list: [requirePermission('list-roles')],
  detail: [requirePermission('detail-roles')],
  create: [requirePermission('create-roles')],
  update: [requirePermission('update-roles')],
}

export const deleteRoleConfig = {
  authorize: [requirePermission('delete-roles')],
  run: async ({ state }) => {
    await deleteUnassignedRole(state.id)
  },
  error: async ({ c, error }) => {
    if (!isHttpError(error) || error.code !== 'role_in_use') return
    const issue = (field: string) => Number(error.issues?.find((item) => item.field === field)?.message ?? 0)
    return c.json({ error: error.code, assignmentCount: issue('assignmentCount') }, 409)
  },
}

export const domain = defineDomainPart({
  tables: {
    permissions,
    roles,
    rolePermissions,
    roleAssignments,
  },
  entities: [role, permission],
})
