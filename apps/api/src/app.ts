import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { installSprindle } from '@southneuhof/sprindle/hono'
import { getDb } from './db'
import { routes } from './routes'

export const app = installSprindle(
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
  routes,
)

export type AppType = typeof app
