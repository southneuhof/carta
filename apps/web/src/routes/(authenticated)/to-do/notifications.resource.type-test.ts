import { notifications } from './notifications.resource'
import type { NotificationRecord } from './notifications.schema'

const row: NotificationRecord = {
  id: 'notification-1',
  recipientUserId: 'user-1',
  projectId: null,
  moduleCode: 'users',
  referenceTable: null,
  referenceId: null,
  title: 'Title',
  body: 'Body',
  readAt: null,
  createdAt: '',
  updatedAt: '',
}
const list = notifications.list({ namespace: 'notifications' })
const detail = notifications.detail({ id: row.id })
const markSeen = notifications.actions.markSeen.run([row.id])
const unreadCount = notifications.actions.unreadCount.run()
void [row, list, detail, markSeen, unreadCount]
