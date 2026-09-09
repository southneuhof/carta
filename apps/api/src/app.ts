import { loadRouteManifest } from '@southneuhof/sprindle/hono'
import { createApp } from './create-app'

export const routeManifest = await loadRouteManifest(
  new URL('..', import.meta.url).pathname,
  process.env.SPRINDLE_ROUTE_MANIFEST ?? (process.env.VITEST ? '.sprindle-test/routes.mjs' : '.sprindle/routes.mjs'),
)
export const app = createApp(routeManifest)
export type AppType = typeof app
