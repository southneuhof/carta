import type { RouteRecordRaw } from 'vue-router'
import type { FrameworkRouteItem, FrameworkRouteModule, InferredLayoutRouteBuildOptions, LayoutResolverOptions, ViewLoader } from './types'

type InferredRoute = {
  layoutName: string
  moduleName: string
  routeName: string
  loader: ViewLoader
}

function toPathSegment(value: string): string {
  return String(value).toLowerCase()
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '')
}

function toTitle(value: string): string {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isSeparatorRoute(route: FrameworkRouteItem): boolean {
  return Boolean(route.separator)
}

function findMenuRoute(modules: FrameworkRouteModule[] | undefined, moduleName: string, routeName: string) {
  const module = modules?.find((item) => toPathSegment(item.name) === moduleName)
  const route = module?.routes.find((item) => !isSeparatorRoute(item) && toPathSegment(item.name) === routeName)

  return module && route ? { module, route } : null
}

function inferRoute(layoutName: string, layoutPath: string, viewPath: string, loader: ViewLoader): InferredRoute | null {
  const normalizedLayoutPath = normalizePath(layoutPath)
  const normalizedViewPath = normalizePath(viewPath)
  const prefix = `${normalizedLayoutPath}/`

  if (!normalizedViewPath.startsWith(prefix)) return null

  const relativePath = normalizedViewPath.slice(prefix.length)
  const segments = relativePath.split('/')

  if (segments.length !== 3) return null

  const [moduleName, routeName, fileName] = segments
  if (!moduleName || !routeName || fileName !== `${routeName}.vue`) return null

  return {
    layoutName,
    moduleName,
    routeName,
    loader,
  }
}

export function buildLayoutRoutes(layouts: LayoutResolverOptions, options: InferredLayoutRouteBuildOptions = {}): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  const routeNames = new Set<string>()
  const includeModuleTitleMeta = options.includeModuleTitleMeta !== false

  for (const [layoutName, layoutConfig] of Object.entries(layouts)) {
    const children: RouteRecordRaw[] = []

    for (const [viewPath, loader] of Object.entries(layoutConfig.views)) {
      const inferred = inferRoute(layoutName, layoutConfig.path, viewPath, loader)
      if (!inferred) continue

      if (routeNames.has(inferred.routeName)) {
        throw new Error(`Duplicate inferred route name: ${inferred.routeName}`)
      }
      routeNames.add(inferred.routeName)

      const menuMatch = findMenuRoute(options.modules, inferred.moduleName, inferred.routeName)
      const meta: Record<string, unknown> = {
        layoutName: inferred.layoutName,
        moduleName: inferred.moduleName,
        routeName: inferred.routeName,
        title: menuMatch?.route.title ?? toTitle(inferred.routeName),
        ...(menuMatch?.route.meta ?? {}),
        ...(menuMatch && includeModuleTitleMeta ? { module_title: menuMatch.module.title } : {}),
      }

      if (menuMatch?.route.children?.length) {
        meta.children = menuMatch.route.children
      } else {
        meta.pages = menuMatch?.route.routes || null
      }

      children.push({
        path: `${inferred.moduleName}/${inferred.routeName}`,
        name: inferred.routeName,
        component: inferred.loader,
        meta,
      })
    }

    routes.push({
      path: `/${layoutName}`,
      component: layoutConfig.layout,
      children,
    })
  }

  return routes
}
