import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { notificationsActions } from './notifications.actions'
import { notificationsSchema } from './notifications.schema'

const fields = defineFields(notificationsSchema, {
  title: { label: 'Judul' },
  body: { label: 'Isi' },
  moduleCode: { label: 'Modul' },
  createdAt: { label: 'Waktu', display: { format: 'datetime' } },
})

export const notifications = defineResource(notificationsSchema, {
  key: 'notifications',
  actions: {
    list: {
      run: notificationsActions.list,
      fields: [fields.title, fields.body, fields.createdAt],
      permission: 'notifications.list',
    },
    detail: {
      run: notificationsActions.detail,
      fields: [fields.title, fields.body, fields.moduleCode, fields.createdAt],
      permission: 'notifications.detail',
    },
    unreadCount: { run: notificationsActions.unreadCount },
    markSeen: { run: notificationsActions.markSeen },
  },
})

export type { NotificationRecord } from './notifications.schema'
