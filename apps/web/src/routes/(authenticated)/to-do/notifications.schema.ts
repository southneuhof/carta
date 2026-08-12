import { defineSchema } from '@southneuhof/is-vue-framework'
import type { WebResourceSchema } from '@southneuhof/is-vue-framework'

export type NotificationRecord = {
  id: string
  recipientUserId: string
  projectId: string | null
  moduleCode: string
  referenceTable: string | null
  referenceId: string | null
  title: string
  body: string
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export type NotificationStatus = 'unread' | 'read'
export type NotificationSchema = WebResourceSchema<NotificationRecord, Record<string, unknown>, Record<string, never>, Record<string, never>, string>

export const notificationsSchema = defineSchema<NotificationSchema>({ identity: 'id' })
