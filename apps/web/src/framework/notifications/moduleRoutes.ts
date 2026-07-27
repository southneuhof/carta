import type { RouteLocationRaw } from 'vue-router'
import type { NotificationRecord } from '@/framework/adapters/resources/notifications'

/**
 * Where a notification points.
 *
 * The reference application resolved this with a nested ternary over
 * `module_name`, duplicated across two components, building route names by string
 * concatenation and `replace(/_/g, '-')`. A mistyped module fell through to a
 * route that did not exist — silently, at runtime.
 *
 * `satisfies` keeps every value checked against the resolver shape while leaving
 * the key set inferred, so adding a module is one line and a wrong shape is a
 * compile error rather than a dead link.
 */
export const notificationRoutes = {
  overtimes: (notification: NotificationRecord) => ({
    name: 'hr-overtimes-detail' as const,
    params: { overtimeId: notification.moduleId as string },
  }),
} satisfies Record<string, (notification: NotificationRecord) => RouteLocationRaw>

export type NotificationModule = keyof typeof notificationRoutes

/**
 * The route a notification opens, or `null` when it opens nothing.
 *
 * `null` is a normal answer, not a failure: notifications arrive for modules this
 * app may not have screens for yet, and a module registered without a `moduleId`
 * would otherwise produce a route with `undefined` params. Callers render those as
 * plain, non-navigating cards.
 */
export function notificationRoute(notification: NotificationRecord): RouteLocationRaw | null {
  const resolve = (notificationRoutes as Record<string, ((n: NotificationRecord) => RouteLocationRaw) | undefined>)[notification.moduleName]
  if (!resolve || !notification.moduleId) return null
  return resolve(notification)
}
