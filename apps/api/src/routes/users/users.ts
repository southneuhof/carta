import { defineDomainPart } from '@southneuhof/sprindle/model'
import { user, users } from './users.entity'

export const domain = defineDomainPart({
  tables: { users },
  entities: [user],
})

export default { domain }
