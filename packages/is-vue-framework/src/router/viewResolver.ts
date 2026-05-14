import type { RouteComponent } from 'vue-router'
import type { LayoutResolveChildInput, LayoutResolveRouteInput, LayoutResolverOptions, LayoutViewResolver, ViewLoader } from './types'

function toPathSegment(value: string): string {
  return String(value).toLowerCase()
}

function getLayoutConfig(layouts: LayoutResolverOptions, layoutKey: string) {
  const config = layouts[layoutKey]
  if (!config) {
    throw new Error(`Missing layout config for key: ${layoutKey}`)
  }

  return config
}

function resolveView(viewMap: Record<string, ViewLoader>, viewPath: string, errorPrefix: string): ViewLoader {
  const loader = viewMap[viewPath]
  if (!loader) {
    throw new Error(`${errorPrefix}: ${viewPath}`)
  }

  return loader
}

export function createLayoutViewResolver(layouts: LayoutResolverOptions): LayoutViewResolver {
  function resolveRouteView(input: LayoutResolveRouteInput): ViewLoader {
    const config = getLayoutConfig(layouts, input.layoutKey)
    const viewPath = `${config.path}/${toPathSegment(input.moduleName)}/${toPathSegment(input.routeName)}/${toPathSegment(input.routeName)}.vue`
    return resolveView(config.views, viewPath, 'Missing layout view')
  }

  function resolveChildView(input: LayoutResolveChildInput): ViewLoader {
    const config = getLayoutConfig(layouts, input.layoutKey)
    const viewPath = `${config.path}/${toPathSegment(input.moduleName)}/${toPathSegment(input.routeName)}/children/${toPathSegment(input.childName)}.vue`
    return resolveView(config.views, viewPath, 'Missing layout child view')
  }

  function resolveLayout(layoutKey: string): RouteComponent {
    return getLayoutConfig(layouts, layoutKey).layout
  }

  return {
    resolveRouteView,
    resolveChildView,
    resolveLayout,
  }
}
