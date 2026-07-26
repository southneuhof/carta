import { defineDomainPart } from '@southneuhof/sprindle/model'
import { overtime, overtimeRelations, overtimes } from './overtimes.entity'
import { overtimeModel } from './overtimes.model'

export const domain = defineDomainPart({
  tables: { overtimes },
  entities: [overtime],
  relations: [overtimeRelations],
})

export { overtimeModel }

export default { domain, overtimeModel }
