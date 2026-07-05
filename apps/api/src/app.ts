import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './db'
import { productModel } from './domains/products/product'

export const app = new Hono()

app.use(
  '*',
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)

app.use('*', async (_c, next) => {
  getDb()
  await next()
})

app.route('/products', productModel.route)

const productContractRoute = new Hono()
  .get('/list', (c) => c.json({ data: [], page: 1, limit: 20 }))
  .get('/detail/:id', (c) => c.json({ data: { id: c.req.param('id') } }))
  .post('/create', (c) => c.json({ data: {} }, 201))
  .patch('/update/:id', (c) => c.json({ data: { id: c.req.param('id') } }))
  .delete('/delete/:id', (c) => c.json({ ok: true }))
  .get('/nested/version1', (c) => c.json({ version: 1 }))
  .get('/nested/test/versionTest', (c) => c.json({ ok: true, version: 'test' }))
  .post('/customProductAction', (c) => c.json({ ok: true, action: 'products' }))
  .get('/customProductMaterialize', (c) => c.json({ data: [] }))

const contractApp = new Hono().route('/products', productContractRoute)

export type AppType = typeof contractApp
