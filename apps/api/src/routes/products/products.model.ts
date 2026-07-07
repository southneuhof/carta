import { create, deleteAction, detail, list, update } from '@southneuhof/sprindle/actions'
import { defineModel } from '@southneuhof/sprindle/model'
import { customProductAction, customProductMaterialize, version1, versionTest } from './products.actions'
import { product } from './products.entity'

export const productModel = defineModel({
  entity: product,
  authorize: [({ c }) => (c.req.header('x-product-access') === 'denied' ? 'Product access denied.' : undefined)],
  actions: {
    list: list(),
    detail: detail(),
    create: create({
      validate: [({ state }) => (isReservedSku(state.input) ? { field: 'sku', message: 'SKU is reserved.' } : undefined)],
    }),
    update: update(),
    delete: deleteAction(),
    gamer: {
      version1: version1(),
      test: {
        versionTest: versionTest(),
      },
    },
    customProductAction: customProductAction(),
    customProductMaterialize: customProductMaterialize(),
  },
})

function isReservedSku(input: unknown) {
  return Boolean(input && typeof input === 'object' && !Array.isArray(input) && (input as { sku?: unknown }).sku === 'RESERVED')
}
