import { defineRoute } from '@southneuhof/sprindle/routes'
import { productModel } from '../domains/products/product'

export const productsRoute = defineRoute({
  path: '/products',
  model: productModel,
})
