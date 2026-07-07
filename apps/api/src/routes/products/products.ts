import { defineDomainPart } from '@southneuhof/sprindle/model'
import { defineRoute } from '@southneuhof/sprindle/routes'
import { product, productRelations, products, productVariantAssignments } from './products.entity'
import { productModel } from './products.model'

export const domain = defineDomainPart({
  tables: { products, productVariantAssignments },
  entities: [product],
  relations: [productRelations],
})

export const route = defineRoute({
  path: '/products',
  model: productModel,
})

export default { domain, route }
