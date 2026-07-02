import { defineDomainSchema } from '@southneuhof/sprindle/model'
import * as productVariantEntity from './domains/product-variants/product-variant.entity'
import * as productEntity from './domains/products/product.entity'
import * as userEntity from './domains/users/user.entity'

export const domainSchema = defineDomainSchema([userEntity, productVariantEntity, productEntity])
