import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { notificationOperations, type NotificationRecord } from './notifications.operations'

export const notificationFields = defineFields<NotificationRecord>()({
  title: { label: 'Judul' },
  body: { label: 'Isi' },
  moduleCode: { label: 'Modul' },
  createdAt: { label: 'Waktu', display: { format: 'datetime' } },
})
export const notifications = defineResource({
  key: 'notifications',
  fields: notificationFields,
  capabilities: {
    list: { handler: notificationOperations.list, permission: 'notifications.list' },
    detail: { handler: notificationOperations.detail, permission: 'notifications.detail' },
  },
  table: { fields: ['title', 'body', 'createdAt'] },
  detail: { fields: ['title', 'body', 'moduleCode', 'createdAt'] },
})

export type { NotificationRecord }
