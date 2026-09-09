import { defineDomainPart } from '@southneuhof/sprindle/model'
import { permission, permissions } from './permissions.entity'

export const domain = defineDomainPart({
  tables: { permissions },
  entities: [permission],
})
