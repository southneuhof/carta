import { isHttpError } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
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

const listRoles = [requirePermission('list-roles')]
const detailRoles = [requirePermission('detail-roles')]
const createRoles = [requirePermission('create-roles')]
const updateRoles = [requirePermission('update-roles')]
const deleteRoles = [requirePermission('delete-roles')]

const deleteRole = deleteRoute({
  authorize: deleteRoles,
  run: async ({ state }) => {
    await deleteUnassignedRole(state.id)
  },
  error: async ({ c, error }) => {
    if (!isHttpError(error) || error.code !== 'role_in_use') return
    const issue = (field: string) => Number(error.issues?.find((item) => item.field === field)?.message ?? 0)
    return c.json({ error: error.code, assignmentCount: issue('assignmentCount') }, 409)
  },
})

export const domain = defineDomainPart({
  tables: {
    permissions,
    roles,
    rolePermissions,
    roleAssignments,
  },
  entities: [role, permission],
})

export const roleModel = defineModel({
  path: '/roles',
  entity: role,
  routes: {
    list: list({ authorize: listRoles }),
    detail: detail({ authorize: detailRoles }),
    create: create({ authorize: createRoles }),
    update: update({ authorize: updateRoles }),
    delete: deleteRole,
  },
})

export default { domain, roleModel }
