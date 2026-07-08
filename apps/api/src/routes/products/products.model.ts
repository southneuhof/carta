import { create, deleteRoute, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import { customProductMaterialize, customProductRoute, version1, versionTest } from './products.routes'
import { product } from './products.entity'

export const productModel = defineModel({
  entity: product,
  authorize: [({ c }) => (c.req.header('x-product-access') === 'denied' ? 'Product access denied.' : undefined)],
  routes: {
    list: list(),
    detail: detail(),
    create: create({
      validate: [({ state }) => (isReservedSku(state.input) ? { field: 'sku', message: 'SKU is reserved.' } : undefined)],
    }),
    update: update(),
    delete: deleteRoute(),
    gamer: {
      version1,
      test: {
        versionTest,
      },
    },
    customProductRoute,
    customProductMaterialize,
  },
})

function isReservedSku(input: unknown) {
  return Boolean(input && typeof input === 'object' && !Array.isArray(input) && (input as { sku?: unknown }).sku === 'RESERVED')
}
