import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { app } from '../../app'
import { closeDb } from '../../db'
import { cleanupFixture, jsonHeaders, makeSession, type OrientationFixture } from '../orientation/orientation-test-helpers'

const permissions = [
  'list-syllabus', 'detail-syllabus', 'create-syllabus',
  'list-syllabus-categories', 'detail-syllabus-categories', 'create-syllabus-categories', 'update-syllabus-categories', 'delete-syllabus-categories',
] as const
const fixtures: OrientationFixture[] = []

describe('syllabus category routes', () => {
  afterEach(async () => {
    while (fixtures.length) await cleanupFixture(fixtures.pop()!)
  })

  it('maps syllabi and toggles roles from category detail', async () => {
    const fixture = await makeSession(permissions)
    fixtures.push(fixture)
    const headers = jsonHeaders(fixture.cookie)
    const syllabus = (await (await app.request('/syllabus/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Mapped Syllabus' }) })).json() as { data: { id: string } }).data
    const category = (await (await app.request('/syllabus-categories/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Category One' }) })).json() as { data: { id: string } }).data
    const mapped = await app.request(`/syllabus-categories/${category.id}/syllabi/create`, { method: 'POST', headers, body: JSON.stringify({ syllabusIds: [syllabus.id] }) })
    expect(mapped.status).toBe(201)
    const list = await app.request(`/syllabus-categories/${category.id}/syllabi/list`, { headers: { Cookie: fixture.cookie } })
    expect(list.status).toBe(200)
    expect((await list.json() as { data: Array<{ syllabus: { name: string } }> }).data).toMatchObject([{ syllabus: { name: 'Mapped Syllabus' } }])
    const toggle = await app.request(`/syllabus-categories/${category.id}/roles/${fixture.roleId}/update`, { method: 'PUT', headers, body: JSON.stringify({ active: true }) })
    expect(toggle.status).toBe(200)
    const roles = await app.request(`/syllabus-categories/${category.id}/roles/list`, { headers: { Cookie: fixture.cookie } })
    expect((await roles.json() as { data: Array<{ roleId: string; active: boolean }> }).data).toContainEqual(expect.objectContaining({ roleId: fixture.roleId, active: true }))
  })
})

afterAll(() => closeDb())
