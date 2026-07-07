import { defineDomainPart } from '@southneuhof/sprindle/model'
import { productVariant, productVariants } from './product-variants.entity'

export const domain = defineDomainPart({
  tables: { productVariants },
  entities: [productVariant],
})

export default { domain }
