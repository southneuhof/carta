import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Hono } from 'hono'
import type { DomainPart } from '@southneuhof/sprindle/model'
import type { DefinedRoute } from '@southneuhof/sprindle/routes'

type AppRouteModule = {
  domain?: DomainPart
  route?: DefinedRoute
}

const modules = await loadRouteModules()

export const domainParts = modules.flatMap((module) => (module.domain ? [module.domain] : []))
export const routes = modules.flatMap((module) => (module.route ? [module.route] : []))

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

async function loadRouteModules(): Promise<AppRouteModule[]> {
  const files = await findRouteModuleFiles(fileURLToPath(new URL('.', import.meta.url)))
  return Promise.all(
    files.map(async (file) => {
      const module = (await import(pathToFileURL(file).href)) as { default?: AppRouteModule }
      return module.default ?? {}
    }),
  )
}

async function findRouteModuleFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const next = path.join(dir, entry.name)
      if (entry.isDirectory()) return findRouteModuleFiles(next)
      if (entry.isFile() && isRouteModuleFile(next)) return [next]
      return []
    }),
  )
  return files.flat().sort()
}

function isRouteModuleFile(file: string) {
  return file.endsWith('.ts') && !file.endsWith('.d.ts') && path.basename(file, '.ts') === path.basename(path.dirname(file))
}
