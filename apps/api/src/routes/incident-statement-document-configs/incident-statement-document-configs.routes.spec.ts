import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { getAuth } from '../auth/auth'
import { accounts, sessions } from '../auth/auth.entity'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { incidentStatementDocumentConfigs } from './incident-statement-document-configs.entity'

const permissionsForCrud = [
  'list-incident-statement-document-configs',
  'detail-incident-statement-document-configs',
  'create-incident-statement-document-configs',
  'update-incident-statement-document-configs',
  'delete-incident-statement-document-configs',
] as const

function id(prefix: string) {
  return `incident-statement-config-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string }
const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Incident Statement Config Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Incident Statement Config Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Incident Statement Config Test Role', realm: 'system' })
  for (const permissionCode of permissionCodes) {
    await db.insert(permissions).values({ id: id('permission'), permissionCode, name: permissionCode, moduleId }).onConflictDoNothing()
    const permission = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, permissionCode)).limit(1))[0]
    if (!permission) throw new Error(`Permission fixture is missing: ${permissionCode}`)
    await db.insert(rolePermissions).values({ roleId, permissionId: permission.id })
  }
  await db.insert(systemRoleAssignments).values({ userId, roleId })
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  const fixture = { userId, moduleId, roleId, cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '' }
  fixtures.push(fixture)
  return fixture
}

function jsonHeaders(cookie: string) {
  return { 'Content-Type': 'application/json', Cookie: cookie }
}

describe('incident statement document config routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(incidentStatementDocumentConfigs).where(or(eq(incidentStatementDocumentConfigs.createdByUserId, fixture.userId), eq(incidentStatementDocumentConfigs.updatedByUserId, fixture.userId)))
      await db.delete(sessions).where(eq(sessions.userId, fixture.userId))
      await db.delete(accounts).where(eq(accounts.userId, fixture.userId))
      await db.delete(systemRoleAssignments).where(eq(systemRoleAssignments.userId, fixture.userId))
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, fixture.roleId))
      await db.delete(permissions).where(eq(permissions.moduleId, fixture.moduleId))
      await db.delete(roles).where(eq(roles.id, fixture.roleId))
      await db.delete(authorizationModules).where(eq(authorizationModules.id, fixture.moduleId))
      await db.delete(users).where(eq(users.id, fixture.userId))
    }
  })

  it('keeps the incident config permission family separate', async () => {
    expect((await app.request('/incident-statement-document-configs/list')).status).toBe(401)
    const limited = await makeSession(['list-incident-statement-document-configs'])
    expect((await app.request('/incident-statement-document-configs/list?page=1&limit=20', { headers: { Cookie: limited.cookie } })).status).toBe(200)
    expect((await app.request('/incident-statement-document-configs/create', { method: 'POST', headers: jsonHeaders(limited.cookie), body: JSON.stringify({ name: 'Denied', fileAttachment: 'uploads/denied.pdf' }) })).status).toBe(403)
    expect((await app.request('/finding-criteria/list?page=1&limit=20', { headers: { Cookie: limited.cookie } })).status).toBe(403)
  })

  it('supports validated CRUD and keeps the stored file on update', async () => {
    const fixture = await makeSession(permissionsForCrud)
    const headers = jsonHeaders(fixture.cookie)

    expect((await app.request('/incident-statement-document-configs/create', { method: 'POST', headers, body: JSON.stringify({ name: '   ', fileAttachment: 'uploads/template.pdf' }) })).status).toBe(400)
    expect((await app.request('/incident-statement-document-configs/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Invalid file', fileAttachment: 'documents/template.pdf' }) })).status).toBe(400)

    const createdResponse = await app.request('/incident-statement-document-configs/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '  Incident Template  ', fileAttachment: 'uploads/template.pdf', description: '<p>Template</p>' }),
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({ name: 'Incident Template', fileAttachment: 'uploads/template.pdf', description: '<p>Template</p>', active: true, createdByUserId: fixture.userId })

    const listResponse = await app.request('/incident-statement-document-configs/list?page=1&limit=20', { headers: { Cookie: fixture.cookie } })
    expect(listResponse.status).toBe(200)
    expect((await listResponse.json() as { data: Array<Record<string, unknown>> }).data.some((row) => row.id === created.id && row.name === 'Incident Template')).toBe(true)

    const updateResponse = await app.request(`/incident-statement-document-configs/update/${created.id}`, { method: 'PATCH', headers, body: JSON.stringify({ description: 'Updated description', active: false }) })
    expect(updateResponse.status).toBe(200)
    expect((await updateResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ fileAttachment: 'uploads/template.pdf', description: 'Updated description', active: false })

    expect((await app.request(`/incident-statement-document-configs/detail/${created.id}`, { headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/incident-statement-document-configs/delete/${created.id}`, { method: 'DELETE', headers })).status).toBe(200)
    expect((await app.request(`/incident-statement-document-configs/detail/${created.id}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  }, 20_000)
})

afterAll(() => closeDb())
