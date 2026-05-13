import type { RouteComponent } from 'vue-router'

export type FrameworkRouteChild = {
  name: string
  title: string
  meta?: Record<string, unknown>
}

export type FrameworkRouteItem = {
  separator?: boolean
  name: string
  title: string
  meta?: Record<string, unknown>
  children?: FrameworkRouteChild[]
  routes?: FrameworkRouteChild[]
}

export type FrameworkRouteModule = {
  name: string
  title: string
  routes: Array<FrameworkRouteItem>
}

export type ViewLoader = () => Promise<unknown>

export type LayoutResolverEntry = {
  path: string
  layout: RouteComponent
  views: Record<string, ViewLoader>
}

export type LayoutResolverOptions = Record<string, LayoutResolverEntry>

export type LayoutResolveRouteInput = {
  layoutKey: string
  moduleName: string
  routeName: string
}

export type LayoutResolveChildInput = {
  layoutKey: string
  moduleName: string
  routeName: string
  childName: string
}

export type LayoutViewResolver = {
  resolveRouteView: (input: LayoutResolveRouteInput) => ViewLoader
  resolveChildView: (input: LayoutResolveChildInput) => ViewLoader
  resolveLayout: (layoutKey: string) => RouteComponent
}

export type InferredLayoutRouteBuildOptions = {
  modules?: FrameworkRouteModule[]
  includeModuleTitleMeta?: boolean
}
