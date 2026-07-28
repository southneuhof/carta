import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { notificationOperations, type NotificationRecord } from './notifications.operations'

export const notificationFields = defineFields<NotificationRecord>()({
  title: { label: 'Judul' }, content: { label: 'Isi' }, moduleName: { label: 'Modul' }, createdAt: { label: 'Waktu', display: { format: 'datetime' } },
})
export const notifications = defineResource({
  key: 'notifications', fields: notificationFields,
  capabilities: {
    list: { handler: notificationOperations.list, permission: 'notifications.list' },
    detail: { handler: notificationOperations.detail, permission: 'notifications.detail' },
  },
  table: { fields: ['title', 'content', 'createdAt'] },
  detail: { fields: ['title', 'content', 'moduleName', 'createdAt'] },
})

export type { NotificationRecord }
