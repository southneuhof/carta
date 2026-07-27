import { createHonoResourceOperations, parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import type { ResourceRecordOf } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'

export const notificationOperations = createHonoResourceOperations(rpc.notifications)
export type NotificationRecord = ResourceRecordOf<typeof notificationOperations>
export type NotificationStatus = NotificationRecord['statusCode']

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
  return records.filter((record) => record.statusCode === 'unseen').map((record) => record.id)
}
