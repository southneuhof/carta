import { Hono } from 'hono'
import type { DefinedRoute } from '@southneuhof/sprindle/routes'
import { healthRoute } from './health'
import { productsRoute } from './products'

export const routes = [productsRoute, healthRoute] as const satisfies readonly DefinedRoute[]

export function mountRoutes(app: Hono, routeDefinitions: readonly DefinedRoute[] = routes) {
  for (const route of routeDefinitions) {
    if (route.kind === 'model') {
      app.route(route.path, route.model.route)
      continue
    }

    app.route(route.path, route.route)
  }

  return app
}
