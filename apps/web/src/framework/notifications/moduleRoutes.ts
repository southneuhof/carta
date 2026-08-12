import type { RouteLocationRaw } from 'vue-router'
import type { NotificationRecord } from '@/routes/(authenticated)/to-do/notifications.schema'

export const notificationRoutes: Record<string, ((notification: NotificationRecord) => RouteLocationRaw) | undefined> = {
}
export type NotificationModule = keyof typeof notificationRoutes

export function notificationRoute(notification: NotificationRecord): RouteLocationRaw | null {
  const resolve = notificationRoutes[notification.moduleCode]
  return resolve && notification.referenceId ? resolve(notification) : null
}
