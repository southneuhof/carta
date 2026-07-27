import { describe, expect, it } from 'vitest'
import { notificationRoute, notificationRoutes } from './moduleRoutes'
import type { NotificationRecord } from '@/routes/(authenticated)/to-do/notifications.operations'

function notification(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: 'n1',
    recipientEmployeeId: null,
    jobPositionId: null,
    roleId: null,
    sectionId: null,
    title: 'Judul',
    content: 'Isi',
    statusCode: 'unseen',
    notificationType: 'verification',
    moduleName: 'overtimes',
    moduleId: 'o1',
    payload: null,
    createdByUserId: null,
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:00.000Z',
    jobPosition: null,
    role: null,
    section: null,
    ...overrides,
  }
}

describe('notification deep links', () => {
  it('resolves a registered module to its screen', () => {
    expect(notificationRoute(notification())).toEqual({ name: 'hr-overtimes-detail', params: { overtimeId: 'o1' } })
  })

  it('returns null for a module this app has no screen for', () => {
    // Normal, not an error: the server emits for modules the web app may not
    // have caught up with. The row renders as a plain, non-navigating card.
    expect(notificationRoute(notification({ moduleName: 'presences' }))).toBeNull()
  })

  it('returns null when a registered module carries no moduleId', () => {
    // Otherwise this builds a route with `undefined` params, which resolves to a
    // broken link rather than failing loudly.
    expect(notificationRoute(notification({ moduleId: null }))).toBeNull()
  })

  it('keeps the registry as data, so adding a module is one entry', () => {
    expect(Object.keys(notificationRoutes)).toEqual(['overtimes'])
  })
})
