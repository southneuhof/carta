import { Hono } from 'hono'

type ProductListInput = {
  in: {
    query: {
      page?: string
      limit?: string
      search?: string
    }
  }
}

const productRoutes = new Hono()
  .get<'/list', ProductListInput>('/list', (c) => c.json({ data: [], page: 1, limit: 20 }))
  .get('/detail/:id', (c) => c.json({ data: { id: c.req.param('id') } }))
  .post('/create', (c) => c.json({ data: {} }, 201))
  .patch('/update/:id', (c) => c.json({ data: { id: c.req.param('id') } }))
  .delete('/delete/:id', (c) => c.json({ ok: true }))
  .get('/nested/version1', (c) => c.json({ version: 1 }))
  .get('/nested/test/versionTest', (c) => c.json({ ok: true, version: 'test' }))
  .post('/customProductAction', (c) => c.json({ ok: true, action: 'products' }))

const app = new Hono().route('/products', productRoutes)

export type AppType = typeof app
