import { authenticated, create, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { employee } from './employees.entity'

export const employeeModel = defineModel({
  path: '/employees',
  entity: employee,
  authorize: [authenticated()],
  routes: { list: list(), detail: detail(), create: create(), update: update() },
})
