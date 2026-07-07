import type { z } from 'zod/v4'
import type { product } from './routes/products/products.entity'

type ProductCreate = z.input<typeof product.schemas.create>
type ProductUpdate = z.input<typeof product.schemas.update>

const productCreateOk: ProductCreate = {
  id: 'product-1',
  name: 'Product',
  sku: 'SKU-1',
  ownerId: null,
  author: { id: 'user-1' },
  variants: [{ id: 'body' }],
}

const productUpdateOk: ProductUpdate = {
  name: 'Product',
  sku: 'SKU-1',
  ownerId: null,
  author: { id: 'user-1' },
  variants: [{ id: 'body' }],
}

// @ts-expect-error name must be string
const productCreateBad: ProductCreate = { id: 'product-1', name: 1, sku: 'SKU-1' }
// @ts-expect-error update name must be string
const productUpdateBad: ProductUpdate = { name: 1 }

void productCreateOk
void productUpdateOk
void productCreateBad
void productUpdateBad
