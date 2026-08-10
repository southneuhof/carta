import { createHonoResourceOperations, parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { defineResourceOperations } from '@southneuhof/is-vue-framework'
import type { z } from 'zod/v4'
import { notification } from '@southneuhof/api/routes/notifications/notifications.entity'
import { rpc } from '@/framework/rpc'
import { dataAdapter } from '@/framework/adapters/data/normalize'

const notificationTransport = createHonoResourceOperations(rpc.notifications, dataAdapter)
export const notificationOperations = defineResourceOperations<NotificationRecord, Record<string, never>, Record<string, never>, Record<string, never>>()({
  list: notificationTransport.list,
  detail: notificationTransport.detail,
})
export type NotificationRecord = z.output<typeof notification.schemas.select>
export type NotificationStatus = 'unread' | 'read'
export const NOTIFICATIONS_SEEN_EVENT = 'notifications-seen'

type UnreadEndpoint = (typeof rpc.notifications)['unread-count']['$get']
type MarkSeenEndpoint = (typeof rpc.notifications)['mark-seen']['$post']
export type UnreadCount = HonoResponseOf<UnreadEndpoint, 200>['data']['total']
export type MarkSeenResult = HonoResponseOf<MarkSeenEndpoint, 200>['data']['updated']

export async function unreadNotificationCount(): Promise<UnreadCount> {
  return (await parseHonoResponse<UnreadEndpoint>(await rpc.notifications['unread-count'].$get())).data.total
}
export async function markNotificationsSeen(ids: string[]): Promise<MarkSeenResult> {
  if (ids.length === 0) return 0
  return (await parseHonoResponse<MarkSeenEndpoint>(await rpc.notifications['mark-seen'].$post({ json: { ids } }))).data.updated
}
export function unreadIds(records: readonly NotificationRecord[]): string[] {
  return records.filter((record) => !record.readAt).map((record) => record.id)
}
