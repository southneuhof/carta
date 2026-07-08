import { healthRoute } from './health/health'
import { domain as productVariantsDomain } from './product-variants/product-variants'
import { domain as productsDomain, productModel } from './products/products'
import { domain as usersDomain } from './users/users'

export const domainParts = [productVariantsDomain, productsDomain, usersDomain] as const
export const routes = [healthRoute, productModel] as const
