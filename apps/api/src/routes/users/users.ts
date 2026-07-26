import { defineDomainPart } from '@southneuhof/sprindle/model'
import { user, users } from './users.entity'
import { userModel } from './users.model'

export const domain = defineDomainPart({
  tables: { users },
  entities: [user],
})

export { userModel }
export default { domain, userModel }
