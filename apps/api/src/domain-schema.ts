import { defineDomainSchema } from '@southneuhof/domain/model'
import './domains/users/user.entity'
import './domains/product-variants/product-variant.entity'
import './domains/products/product.entity'

export const domainSchema = defineDomainSchema()
