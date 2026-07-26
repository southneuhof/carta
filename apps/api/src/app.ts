import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { installSprindle, sprindleNotFound, sprindleOnError } from '@southneuhof/sprindle/hono'
import { getDb } from './db'
import { routes } from './routes'
import { getAuth } from './routes/auth/auth'

const appOrigin = process.env.APP_ORIGIN
if (!appOrigin) throw new Error('APP_ORIGIN is required.')

export const app = installSprindle(
  new Hono()
    .onError(sprindleOnError)
    .notFound(sprindleNotFound)
    .use(
      '*',
      cors({
        origin: appOrigin,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        exposeHeaders: ['Set-Cookie'],
        credentials: true,
      }),
    )
    .use('*', async (_c, next) => {
      getDb()
      await next()
    })
    .use('*', async (c, next) => {
      if (c.req.path === '/health' || c.req.path.startsWith('/api/auth/')) return next()
      const session = await getAuth().api.getSession({ headers: c.req.raw.headers })
      if (!session) return c.json({ error: 'unauthorized' }, 401)
      await next()
    }),
  routes,
)

export type AppType = typeof app
