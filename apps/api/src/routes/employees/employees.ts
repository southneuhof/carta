import { defineDomainPart } from '@southneuhof/sprindle/model'
import { employees } from '../organization/organization.entity'
import { employee, employeeRelations } from './employees.entity'
import { employeeModel } from './employees.model'

export const domain = defineDomainPart({
  tables: { employees },
  entities: [employee],
  relations: [employeeRelations],
})

export { employeeModel }

export default { domain, employeeModel }
