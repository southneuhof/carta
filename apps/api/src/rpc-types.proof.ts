import type { z } from 'zod/v4'
import type { Hono } from 'hono'
import type { AppType } from './app'
import type { product } from './routes/products/products.entity'

type ProductCreate = z.input<typeof product.schemas.create>
type ProductUpdate = z.input<typeof product.schemas.update>

type AppSchema = AppType extends Hono<any, infer TSchema> ? TSchema : never
type HasProductsList = '/products/list' extends keyof AppSchema ? true : false
type HasProductsCreate = '/products/create' extends keyof AppSchema ? true : false
type HasProductsNested = '/products/gamer/version1' extends keyof AppSchema ? true : false
type HasHealth = '/health' extends keyof AppSchema ? true : false

const hasProductsList: HasProductsList = true
const hasProductsCreate: HasProductsCreate = true
const hasProductsNested: HasProductsNested = true
const hasHealth: HasHealth = true

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
void hasProductsList
void hasProductsCreate
void hasProductsNested
void hasHealth
