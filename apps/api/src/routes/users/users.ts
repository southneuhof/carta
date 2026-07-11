import { defineDomainPart } from '@southneuhof/sprindle/model'
import { defineRelationsPart } from 'drizzle-orm'
import { roles } from '../roles/roles.entity'
import { user, users } from './users.entity'
import { userModel } from './users.model'

export const userRelations = defineRelationsPart({ users, roles }, (r) => ({
  users: {
    role: r.one.roles({ from: r.users.roleId, to: r.roles.id }),
  },
}))

export const domain = defineDomainPart({
  tables: { users },
  entities: [user],
  relations: [userRelations],
})

export { userModel }
export default { domain, userModel }
