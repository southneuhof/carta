import { mount as healthMount } from './health/health'
import { domain as productVariantsDomain } from './product-variants/product-variants'
import { domain as productsDomain, mount as productsMount } from './products/products'
import { mount as testMount } from './test/test'
import { domain as usersDomain } from './users/users'

export const domainParts = [productVariantsDomain, productsDomain, usersDomain] as const
export const mounts = [healthMount, productsMount, testMount] as const
