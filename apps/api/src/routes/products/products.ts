import { defineDomainPart } from '@southneuhof/sprindle/model'
import { product, productRelations, products, productVariantAssignments } from './products.entity'
import { productModel } from './products.model'

export const domain = defineDomainPart({
  tables: { products, productVariantAssignments },
  entities: [product],
  relations: [productRelations],
})

export { productModel }

export default { domain, productModel }
