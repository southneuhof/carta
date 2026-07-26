import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { createAuthGuard } from './guards'
import { legacyViewRedirect, normalizeLegacyHashLocation } from './legacy-urls'

// Legacy hash URLs are rewritten before the router reads the location.
normalizeLegacyHashLocation()

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => legacyViewRedirect(to) ?? true)
router.beforeEach(createAuthGuard())

export default router
