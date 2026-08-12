import type { CollectionLoadContext, CollectionResult, RecordLoadContext } from '@southneuhof/is-vue-framework'
import { createHonoResourceActions, parseHonoResponse, type HonoResponseOf } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import type { NotificationRecord } from './notifications.schema'

export const NOTIFICATIONS_SEEN_EVENT = 'notifications-seen'

const transport = createHonoResourceActions(rpc.notifications)

const list = (context: CollectionLoadContext<Record<string, unknown>>): Promise<CollectionResult<NotificationRecord>> =>
  transport.list(context as never) as Promise<CollectionResult<NotificationRecord>>

const detail = (context: RecordLoadContext<string>): Promise<NotificationRecord | undefined> =>
  transport.detail(context as never) as Promise<NotificationRecord | undefined>

type UnreadEndpoint = (typeof rpc.notifications)['unread-count']['$get']
type MarkSeenEndpoint = (typeof rpc.notifications)['mark-seen']['$post']
type UnreadCount = HonoResponseOf<UnreadEndpoint, 200>['data']['total']
type MarkSeenResult = HonoResponseOf<MarkSeenEndpoint, 200>['data']['updated']

async function unreadCount(): Promise<UnreadCount> {
  return (await parseHonoResponse<UnreadEndpoint>(await rpc.notifications['unread-count'].$get())).data.total
}

async function markSeen(ids: string[]): Promise<MarkSeenResult> {
  if (ids.length === 0) return 0
  return (await parseHonoResponse<MarkSeenEndpoint>(await rpc.notifications['mark-seen'].$post({ json: { ids } }))).data.updated
}

export function unreadIds(records: readonly NotificationRecord[]): string[] {
  return records.filter((record) => !record.readAt).map((record) => record.id)
}

export const notificationsActions = { list, detail, unreadCount, markSeen }
