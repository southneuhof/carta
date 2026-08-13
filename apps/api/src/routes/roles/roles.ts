import { isHttpError, unauthorized } from '@southneuhof/sprindle'
import { defineDomainPart, defineModel } from '@southneuhof/sprindle/model'
import { authenticated, create, detail, defineRoute, list, update } from '@southneuhof/sprindle/routes'
import { orgIdentity, requirePermission } from '../../identity'
import {
  authorizationAuditEvents,
  authorizationModule,
  authorizationModules,
  permissions,
  permission,
  projectRoleAssignments,
  role,
  rolePermissions,
  roles,
  systemRoleAssignments,
} from './roles.entity'
import { assignProjectRole, listProjectRoleAssignments, listProjectRoleAssignmentOptions, revokeProjectRole } from './project-role-assignments.routes'
import { assignRolePermission, listRolePermissions, revokeRolePermission } from './role-permissions.routes'
import { assignSystemRole, listSystemRoleAssignments, revokeSystemRole } from './system-role-assignments.routes'
import { deleteUnassignedRole } from '../../authorization'

const listRoles = [authenticated(), requirePermission('list-roles')]
const detailRoles = [authenticated(), requirePermission('detail-roles')]
const createRoles = [authenticated(), requirePermission('create-roles')]
const updateRoles = [authenticated(), requirePermission('update-roles')]
const deleteRoles = [authenticated(), requirePermission('delete-roles')]
const listPermissions = [authenticated(), requirePermission('list-permissions')]
const detailPermissions = [authenticated(), requirePermission('detail-permissions')]

const deleteRole = defineRoute({
  path: '/:id',
  method: 'delete',
  kind: 'delete',
  authorize: deleteRoles,
  action: async (args) => {
    const id = args.c.req.param('id')
    const identity = await orgIdentity(args)
    if (!id) return args.c.json({ error: 'not_found' }, 404)
    if (!identity) throw unauthorized()
    try {
      return args.c.json(await deleteUnassignedRole(id))
    } catch (error) {
      if (isHttpError(error) && error.code === 'role_in_use') {
        const issue = (field: string) => Number(error.issues?.find((item) => item.field === field)?.message ?? 0)
        return args.c.json({ error: error.code, systemAssignmentCount: issue('systemAssignmentCount'), projectAssignmentCount: issue('projectAssignmentCount') }, 409)
      }
      throw error
    }
  },
})

export const domain = defineDomainPart({
  tables: {
    authorizationModules,
    permissions,
    roles,
    rolePermissions,
    systemRoleAssignments,
    projectRoleAssignments,
    authorizationAuditEvents,
  },
  entities: [authorizationModule, role, permission],
})

export const moduleModel = defineModel({
  path: '/modules',
  entity: authorizationModule,
  routes: {
    list: list({ authorize: listPermissions }),
    detail: detail({ authorize: detailPermissions }),
  },
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

export const permissionModel = defineModel({
  path: '/permissions',
  entity: permission,
  routes: {
    list: list({ authorize: listPermissions }),
    detail: detail({ authorize: detailPermissions }),
  },
})

export {
  assignRolePermission,
  assignSystemRole,
  listProjectRoleAssignmentOptions,
  listProjectRoleAssignments,
  listRolePermissions,
  listSystemRoleAssignments,
  revokeRolePermission,
  revokeSystemRole,
  assignProjectRole,
  revokeProjectRole,
}

export default { domain, moduleModel, roleModel, permissionModel }
