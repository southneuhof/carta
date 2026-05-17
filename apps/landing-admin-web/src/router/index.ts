import { createRouter, createWebHashHistory } from 'vue-router'
import { buildLayoutRoutes } from '@southneuhof/is-vue-framework/router'
import type { FrameworkRouteModule } from '@southneuhof/is-vue-framework/router'
import menu from '@/menu'
import { createAuthGuard } from './guards'
import { appLayouts } from '@/configs/appLayouts'

const notFoundRoute = {
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/layouts/Blank.vue'),
  meta: { title: 'Not Found' },
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...buildLayoutRoutes(appLayouts, {
      modules: menu as unknown as FrameworkRouteModule[],
    }),
    notFoundRoute,
  ],
})

router.beforeEach(createAuthGuard())

export default router
