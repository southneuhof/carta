import { defineDomainPart } from '@southneuhof/sprindle/model'
import { permissions, role, rolePermissions, roles } from './roles.entity'
import { roleModel } from './roles.model'
import { assignRolePermission, listRolePermissions, revokeRolePermission } from './role-permissions.routes'

export const domain = defineDomainPart({ tables: { roles, permissions, rolePermissions }, entities: [role] })
export { assignRolePermission, listRolePermissions, revokeRolePermission, roleModel }

export default { domain, roleModel }
