import { defineDomainPart } from '@southneuhof/sprindle/model'
import { configVerificators, logVerifications } from './verification.entity'

// Tables only. These are driven by the workflow in plan 024, not by CRUD endpoints,
// so there is no entity and no model here.
export const domain = defineDomainPart({
  tables: { configVerificators, logVerifications },
  entities: [],
})

export default { domain }
