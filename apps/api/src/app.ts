import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './db'
import { mountRoutes } from './routes'
export type { AppType } from './rpc.generated'

export const app = mountRoutes(
  new Hono()
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
    }),
)
