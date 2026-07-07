import { route as healthRoute } from './health/health'
import { domain as productVariantsDomain } from './product-variants/product-variants'
import { domain as productsDomain, route as productsRoute } from './products/products'
import { route as testRoute } from './test/test'
import { domain as usersDomain } from './users/users'

export const domainParts = [productVariantsDomain, productsDomain, usersDomain] as const
export const routes = [healthRoute, productsRoute, testRoute] as const
