import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { notificationOperations, type NotificationRecord } from './notifications.operations'

export const notificationFields = defineFields<NotificationRecord>()({
  title: { label: 'Judul' }, content: { label: 'Isi' }, moduleName: { label: 'Modul' }, createdAt: { label: 'Waktu', display: { format: 'datetime' } },
})
export const notifications = defineResource({
  key: 'notifications', fields: notificationFields, operations: notificationOperations,
  table: { fields: ['title', 'content', 'createdAt'] },
  detail: { fields: ['title', 'content', 'moduleName', 'createdAt'] },
})

export type { NotificationRecord }
