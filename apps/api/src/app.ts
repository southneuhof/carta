import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './db'
import { productModel } from './domains/products/product'
export type { AppType } from './rpc.generated'

export const app = new Hono()
  .use(
    '*',
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    }),
  )
  .use('*', async (_c, next) => {
    getDb()
    await next()
  })
  .route('/products', productModel.route)
