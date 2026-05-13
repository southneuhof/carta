import { createRouter, createWebHashHistory } from 'vue-router'
import { buildLayoutRoutes, createLayoutViewResolver } from '@southneuhof/is-vue-framework/router'
import type { FrameworkRouteModule } from '@southneuhof/is-vue-framework/router'
import menu from '@/menu'
import { createAuthGuard } from './guards'
import { appLayouts } from '@/app/configs/appLayouts'

const resolver = createLayoutViewResolver(appLayouts)

const loginRoute = {
  path: '/unauthenticated/auth/login',
  name: 'login',
  component: resolver.resolveRouteView({
    layoutKey: 'unauthenticated',
    moduleName: 'auth',
    routeName: 'login',
  }),
}

const notFoundRoute = {
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/layouts/Blank.vue'),
  meta: { title: 'Not Found' },
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    loginRoute,
    ...buildLayoutRoutes(menu as unknown as FrameworkRouteModule[], {
      resolver,
      resolveLayoutKey: () => 'authenticated',
    }),
    notFoundRoute,
  ],
})

router.beforeEach(createAuthGuard())

export default router
