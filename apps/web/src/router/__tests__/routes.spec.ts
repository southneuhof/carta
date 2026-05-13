import { describe, expect, it } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { buildLayoutRoutes } from '@southneuhof/is-vue-framework/router'
import type { FrameworkRouteModule } from '@southneuhof/is-vue-framework/router'
import menu from '@/menu'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...buildLayoutRoutes(
      {
        authenticated: {
          path: '/src/views/authenticated',
          layout: { name: 'AuthenticatedLayout' } as any,
          views: {
            '/src/views/authenticated/dashboard/dashboard/dashboard.vue': () => Promise.resolve({}),
            '/src/views/authenticated/settings/users/users.vue': () => Promise.resolve({}),
          },
        },
        unauthenticated: {
          path: '/src/views/unauthenticated',
          layout: { name: 'UnauthenticatedLayout' } as any,
          views: {
            '/src/views/unauthenticated/auth/login/login.vue': () => Promise.resolve({}),
          },
        },
      },
      {
        modules: menu as unknown as FrameworkRouteModule[],
      },
    ),
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: { name: 'NotFound' },
    },
  ],
})

describe('router routes', () => {
  it('resolves inferred layout-prefixed routes', () => {
    expect(router.resolve('/unauthenticated/auth/login').name).toBe('login')
    expect(router.resolve('/authenticated/settings/users').name).toBe('users')
    expect(router.resolve('/authenticated/dashboard/dashboard').name).toBe('dashboard')
    expect(router.resolve({ name: 'users' }).path).toBe('/authenticated/settings/users')
  })

  it('does not resolve legacy authenticated paths to inferred route names', () => {
    expect(router.resolve('/settings/users').name).not.toBe('users')
  })
})
