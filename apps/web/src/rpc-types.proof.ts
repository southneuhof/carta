import type { z } from 'zod/v4'
import { createRpcClient } from '@southneuhof/sdk'
import type { product } from '@southneuhof/api/routes/products/products.entity'

type ProductCreate = z.input<typeof product.schemas.create>

const productCreateOk: ProductCreate = {
  id: 'product-1',
  name: 'Product',
  sku: 'SKU-1',
  ownerId: null,
}

// @ts-expect-error name must be string
const productCreateBad: ProductCreate = { id: 'product-1', name: 1, sku: 'SKU-1' }

const api = createRpcClient('http://localhost')
api.products.create.$post({ json: productCreateOk })
// @ts-expect-error create only supports POST
api.products.create.$get({})
// @ts-expect-error body must be under json
api.products.create.$post({ name: 'Product' })
// @ts-expect-error json payload must use product create schema
api.products.create.$post({ json: { id: 'product-1', name: 1, sku: 'SKU-1' } })
