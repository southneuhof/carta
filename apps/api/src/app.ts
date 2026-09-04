import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { consoleLogger, installSprindle, requestContext, sprindleNotFound } from '@southneuhof/sprindle/hono'
import { openapiRoute } from '@southneuhof/sprindle/openapi'
import { getDb } from './db'
import { modules } from './routes'
import { getAuth } from './routes/auth/auth'
import { onError } from './unique-violation'
import { auditStamp } from './audit'
import { assetRequestContext, storedAssetResponse } from './storage/assets'

export const app = installSprindle(
  new Hono()
    .onError(onError)
    .notFound(sprindleNotFound)
    .use('*', requestContext())
    .use('*', assetRequestContext())
    .use(
      '*',
      cors({
        origin: (origin) => origin,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        exposeHeaders: ['Set-Cookie', 'Content-Disposition'],
        credentials: true,
      }),
    )
    .use('*', async (_c, next) => {
      getDb()
      await next()
    }),
  [...modules, openapiRoute(modules, { title: 'Carta API', version: '0.0.0' })] as const,
  {
    identity: (c) => getAuth().api.getSession({ headers: c.req.raw.headers }),
    logger: consoleLogger,
    dataWrite: auditStamp(),
    pipeline: { after: storedAssetResponse },
  },
)

export type AppType = typeof app
