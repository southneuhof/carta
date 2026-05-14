import AuthenticatedLayout from '@/layouts/Authenticated.vue'
import UnauthenticatedLayout from '@/layouts/Unauthenticated.vue'
import type { LayoutResolverOptions } from '@southneuhof/is-vue-framework/router'

const authenticatedViews = import.meta.glob('/src/views/authenticated/**/*.vue')
const unauthenticatedViews = import.meta.glob('/src/views/unauthenticated/**/*.vue')

export const appLayouts = {
  authenticated: {
    path: '/src/views/authenticated',
    layout: AuthenticatedLayout,
    views: authenticatedViews,
  },
  unauthenticated: {
    path: '/src/views/unauthenticated',
    layout: UnauthenticatedLayout,
    views: unauthenticatedViews,
  },
} satisfies LayoutResolverOptions
