import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { app } from '../../app'
import { closeDb } from '../../db'
import { cleanupFixture, jsonHeaders, makeSession, type OrientationFixture } from '../orientation/orientation-test-helpers'

const permissions = [
  'list-syllabus', 'create-syllabus',
  'list-learning-materials', 'detail-learning-materials', 'create-learning-materials', 'update-learning-materials', 'delete-learning-materials',
] as const
const fixtures: OrientationFixture[] = []

describe('learning material routes', () => {
  afterEach(async () => {
    while (fixtures.length) await cleanupFixture(fixtures.pop()!)
  })

  it('keeps questions and answers parent-scoped', async () => {
    const fixture = await makeSession(permissions)
    fixtures.push(fixture)
    const headers = jsonHeaders(fixture.cookie)
    const syllabus = (await (await app.request('/syllabus/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Question Syllabus' }) })).json() as { data: { id: string } }).data
    const material = (await (await app.request('/learning-materials/create', { method: 'POST', headers, body: JSON.stringify({ syllabusId: syllabus.id, name: 'Quiz Material', content: '<p>Quiz</p>', isHaveQuiz: true }) })).json() as { data: { id: string } }).data
    const question = await app.request(`/learning-materials/${material.id}/questions/create`, { method: 'POST', headers, body: JSON.stringify({ name: 'Question one', answers: [{ code: 'A', name: 'Wrong', isAnswer: false }, { code: 'B', name: 'Right', isAnswer: true }] }) })
    expect(question.status).toBe(201)
    const detail = await app.request(`/learning-materials/detail/${material.id}`, { headers: { Cookie: fixture.cookie } })
    expect(detail.status).toBe(200)
    expect((await detail.json() as { data: { totalQuestion: number; questions: Array<{ answers: unknown[] }> } }).data).toMatchObject({ totalQuestion: 1, questions: [{ answers: [{ code: 'A' }, { code: 'B', isAnswer: true }] }] })
    const invalid = await app.request(`/learning-materials/${material.id}/questions/create`, { method: 'POST', headers, body: JSON.stringify({ name: 'Invalid', answers: [{ code: 'A', name: 'One', isAnswer: true }, { code: 'B', name: 'Two', isAnswer: true }] }) })
    expect(invalid.status).toBe(400)
  })
})

afterAll(() => closeDb())
