import { defineDomainPart } from '@southneuhof/sprindle/model'
import { permissions, role, rolePermissions, roles, userRoles } from './roles.entity'
import { roleModel } from './roles.model'
import { assignRolePermission, listRolePermissions, revokeRolePermission } from './role-permissions.routes'
import { assignUserRole, listUserRoles, revokeUserRole } from './user-roles.routes'

export const domain = defineDomainPart({ tables: { roles, permissions, rolePermissions, userRoles }, entities: [role] })
export {
  assignRolePermission,
  assignUserRole,
  listRolePermissions,
  listUserRoles,
  revokeRolePermission,
  revokeUserRole,
  roleModel,
}

export default { domain, roleModel }
