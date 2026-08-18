import { beforeAll, describe, expect, it } from 'vitest'
import { Hono } from 'hono'

let app: Hono

const customRoutes: Array<{ method: 'GET' | 'POST'; path: string; body?: unknown }> = [
  { method: 'GET', path: '/createContext' },
  { method: 'GET', path: '/schedules/list' },
  { method: 'GET', path: '/schedules/schedule-1/createContext' },
  { method: 'POST', path: '/actions/report-1/completeReport', body: { inspectionPointCode: 'point', workMethod: 'method' } },
  { method: 'POST', path: '/actions/report-1/workItems/row-1/verify', body: { resultCode: 'approved' } },
  {
    method: 'POST',
    path: '/actions/report-1/submitDocumentations',
    body: {
      documentations: [
        { name: 'sudut 1', fileAttachment: 'uploads/photo-1' },
        { name: 'sudut 2', fileAttachment: 'uploads/photo-2' },
        { name: 'sudut 3', fileAttachment: 'uploads/photo-3' },
        { name: 'sudut 4', fileAttachment: 'uploads/photo-4' },
      ],
    },
  },
  { method: 'POST', path: '/actions/report-1/verify', body: { resultCode: 'approved' } },
] as const

describe('Quality Inspection custom route registration', () => {
  beforeAll(async () => {
    await import('../../db')
    const { qualityInspectionModel } = await import('./quality-inspection')
    app = new Hono().route('/quality-inspection', qualityInspectionModel.route)
  })

  it.each(customRoutes)('$method $path is mounted at its route-tree URL', async ({ method, path, body }) => {
    const response = await app.request(`/quality-inspection${path}`, {
      method,
      ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
    })

    expect([401, 403]).toContain(response.status)
  })
})
