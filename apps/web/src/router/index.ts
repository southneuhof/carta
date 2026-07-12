import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { createAuthGuard } from './guards'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(createAuthGuard())

export default router
