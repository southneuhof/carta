import { describe, expect, it } from 'vitest'
import { notificationRoute, notificationRoutes } from './moduleRoutes'
import type { NotificationRecord } from '@/routes/(authenticated)/to-do/notifications.schema'

const notification = (overrides: Partial<NotificationRecord> = {}): NotificationRecord =>
  ({
    id: 'n1',
    title: 'Title',
    body: 'Content',
    moduleCode: 'unknown',
    referenceTable: null,
    referenceId: 'id',
    projectId: null,
    readAt: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }) as NotificationRecord

describe('notification deep links', () => {
  it('returns no route for an unregistered module', () => {
    expect(notificationRoute(notification())).toBeNull()
  })

  it('resolves manual PTS notifications to the detail route', () => {
    expect(notificationRoute(notification({ moduleCode: 'qhsse-pts' }))).toEqual({ name: 'quality-pts-detail', params: { ptsId: 'id' } })
    expect(Object.keys(notificationRoutes)).toEqual(['qhsse-pts'])
  })
})
