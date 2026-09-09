import { defineDomainPart } from '@southneuhof/sprindle/model'
import {
  role,
  rolePermissions,
  roles,
  roleAssignments,
} from './roles.entity'

export const domain = defineDomainPart({
  tables: {
    roles,
    rolePermissions,
    roleAssignments,
  },
  entities: [role],
})
