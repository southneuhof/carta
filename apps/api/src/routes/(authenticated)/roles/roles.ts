import { defineDomainPart } from '@southneuhof/sprindle/model'
import {
  permissions,
  permission,
  role,
  rolePermissions,
  roles,
  roleAssignments,
} from './roles.entity'

export const domain = defineDomainPart({
  tables: {
    permissions,
    roles,
    rolePermissions,
    roleAssignments,
  },
  entities: [role, permission],
})
