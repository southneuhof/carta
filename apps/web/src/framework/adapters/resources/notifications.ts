import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { rpc } from '@/framework/rpc'
import { createRpcOperations } from './rpcResource'
import { parseRpcResponse } from './rpcRoute'
import type { RpcCRUDRoute } from './rpcRoute'

/**
 * `unseen` — delivered and unread. `seen` — read.
 * `unset`  — **not a read state.** A chain step whose turn has not come. It must
 *            never count toward the badge and must never be marked seen; treating
 *            it as unread inflates every badge in the system.
 */
export type NotificationStatus = 'unseen' | 'seen' | 'unset'

export interface NotificationRecord extends Record<string, unknown> {
  id: string
  title: string
  content: string
  statusCode: NotificationStatus
  notificationType: string
  moduleName: string
  moduleId: string | null
  payload: unknown
  createdAt: string
}

export interface NotificationQuery extends Record<string, unknown> {
  page?: number
  limit?: number
  search?: string
  statusCode?: NotificationStatus
}

export const notificationFields = defineFields<NotificationRecord>()({
  title: { label: 'Judul' },
  content: { label: 'Isi' },
  moduleName: { label: 'Modul' },
  createdAt: { label: 'Waktu', display: { format: 'datetime' } },
})

/**
 * List and detail only: the API exposes no notification writes, because
 * notifications are produced by workflows rather than by clients. The absent
 * operations mean the standard create/delete controls never appear.
 */
export const notifications = defineResource<NotificationRecord, NotificationQuery>({
  key: 'notifications',
  fields: notificationFields,
  operations: createRpcOperations<NotificationRecord, NotificationQuery>(rpc.notifications as unknown as RpcCRUDRoute),
  table: { fields: ['title', 'content', 'createdAt'] },
  detail: { fields: ['title', 'content', 'moduleName', 'createdAt'] },
})

/** Unread only — the server excludes `unset`, and nothing here should re-add it. */
export async function unreadNotificationCount(): Promise<number> {
  const payload = await parseRpcResponse<{ data: { total: number } }>(await rpc.notifications['unread-count'].$get())
  return payload.data.total
}

/** Marks the given notifications read. Ids the caller cannot see are ignored server-side. */
export async function markNotificationsSeen(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0
  const payload = await parseRpcResponse<{ data: { updated: number } }>(await rpc.notifications['mark-seen'].$post({ json: { ids } }))
  return payload.data.updated
}

/** The ids worth marking read: `unseen` only, never `unset`. */
export function unreadIds(records: readonly NotificationRecord[]): string[] {
  return records.filter((record) => record.statusCode === 'unseen').map((record) => record.id)
}
