import { authenticated, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { user } from './users.entity'

export const userModel = defineModel({
  path: '/users',
  entity: user,
  authorize: [authenticated()],
  routes: { list: list(), detail: detail(), update: update() },
})
