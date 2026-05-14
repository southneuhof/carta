import { describe, expect, it } from 'vitest'
import type { RouteComponent } from 'vue-router'
import { createLayoutViewResolver } from '../viewResolver'

describe('createLayoutViewResolver', () => {
  it('resolves leaf/child views and layout from layout config', () => {
    const leaf = () => Promise.resolve({ default: 'leaf' })
    const child = () => Promise.resolve({ default: 'child' })
    const layout = {} as RouteComponent

    const resolver = createLayoutViewResolver({
      app: {
        path: '/src/views/authenticated',
        layout,
        views: {
          '/src/views/authenticated/settings/users/users.vue': leaf,
          '/src/views/authenticated/settings/users/children/detail.vue': child,
        },
      },
    })

    expect(resolver.resolveRouteView({ layoutKey: 'app', moduleName: 'settings', routeName: 'users' })).toBe(leaf)
    expect(resolver.resolveChildView({ layoutKey: 'app', moduleName: 'settings', routeName: 'users', childName: 'detail' })).toBe(child)
    expect(resolver.resolveLayout('app')).toBe(layout)
  })

  it('throws useful errors for missing layout key or view', () => {
    const resolver = createLayoutViewResolver({
      app: {
        path: '/src/views/authenticated',
        layout: {} as RouteComponent,
        views: {},
      },
    })

    expect(() => resolver.resolveRouteView({ layoutKey: 'missing', moduleName: 'a', routeName: 'b' })).toThrow(
      'Missing layout config for key: missing',
    )

    expect(() => resolver.resolveRouteView({ layoutKey: 'app', moduleName: 'a', routeName: 'b' })).toThrow(
      'Missing layout view: /src/views/authenticated/a/b/b.vue',
    )
  })
})
