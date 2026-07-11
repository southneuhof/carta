import { create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { user } from './users.entity'

export const userModel = defineModel({
  path: '/users',
  entity: user,
  routes: { list: list(), detail: detail(), create: create(), update: update(), delete: deleteRoute() },
})
