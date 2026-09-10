import { defineDomainPart } from '@southneuhof/sprindle/model'
import { accounts, sessions, verifications } from './auth.entity'

export const domain = defineDomainPart({
  tables: { sessions, accounts, verifications },
  entities: [],
})
