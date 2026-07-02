import { create, deleteAction, detail, list, update } from '@southneuhof/sprindle/actions'
import { defineModel } from '@southneuhof/sprindle/model'
import { customProductAction, version1, versionTest } from './product.actions'
import { product } from './product.entity'

export const productModel = defineModel({
  entity: product,
  actions: {
    list: list(),
    detail: detail(),
    create: create(),
    update: update(),
    delete: deleteAction(),
    nested: {
      version1,
      test: {
        versionTest,
      },
    },
    customProductAction,
  },
})
