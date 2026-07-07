import { Hono } from 'hono'
import type { DefinedRoute } from '@southneuhof/sprindle/routes'
import { route as healthRoute } from './health/health'
import { domain as productVariantsDomain } from './product-variants/product-variants'
import { domain as productsDomain, route as productsRoute } from './products/products'
import { route as testRoute } from './test/test'
import { domain as usersDomain } from './users/users'

export const domainParts = [productVariantsDomain, productsDomain, usersDomain] as const
export const routes = [healthRoute, productsRoute, testRoute] as const

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
