import type { RouteNamedMap } from 'vue-router/auto-routes'

/** Every route name the file-based router generates; single source for manifest typing. */
export type AppRouteName = keyof RouteNamedMap & string
