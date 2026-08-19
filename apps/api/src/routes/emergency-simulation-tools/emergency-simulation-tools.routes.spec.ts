import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { emergencySimulationTools } from './emergency-simulation-tools.entity'

const crudPermissions = [
  'list-emergency-simulation-tools',
  'detail-emergency-simulation-tools',
  'create-emergency-simulation-tools',
  'update-emergency-simulation-tools',
  'delete-emergency-simulation-tools',
] as const

function id(prefix: string) {
  return `emergency-simulation-tool-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string }
const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Emergency Simulation Tool Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Emergency Simulation Tool Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Emergency Simulation Tool Test Role', realm: 'system' })
  for (const permissionCode of permissionCodes) {
    await db.insert(permissions).values({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId }).onConflictDoNothing()
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

describe('Perlengkapan Tanggap Darurat routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(emergencySimulationTools).where(or(eq(emergencySimulationTools.createdByUserId, fixture.userId), eq(emergencySimulationTools.updatedByUserId, fixture.userId)))
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

  it('requires authentication and permission', async () => {
    expect((await app.request('/emergency-simulation-tools/list')).status).toBe(401)
    const limited = await makeSession([])
    expect((await app.request('/emergency-simulation-tools/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/emergency-simulation-tools/create', { method: 'POST', headers: jsonHeaders(limited.cookie), body: JSON.stringify({ name: 'Denied' }) })).status).toBe(403)
  })

  it('supports validated audited CRUD', async () => {
    const fixture = await makeSession(crudPermissions)
    const headers = jsonHeaders(fixture.cookie)
    expect((await app.request('/emergency-simulation-tools/create', { method: 'POST', headers, body: JSON.stringify({ name: '   ' }) })).status).toBe(400)
    const createdResponse = await app.request('/emergency-simulation-tools/create', { method: 'POST', headers, body: JSON.stringify({ name: '  Alat Copy  ', description: ' Description ', code: '  TOOL-COPY  ' }) })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({ name: 'Alat Copy', description: 'Description', code: 'TOOL-COPY', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    const duplicate = await app.request('/emergency-simulation-tools/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Duplicate', code: 'TOOL-COPY' }) })
    expect(duplicate.status).toBe(400)
    const updateResponse = await app.request(`/emergency-simulation-tools/update/${String(created.id)}`, { method: 'PATCH', headers, body: JSON.stringify({ name: '  Updated Tool  ', description: null, active: false }) })
    expect(updateResponse.status).toBe(200)
    expect((await updateResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ name: 'Updated Tool', description: null, active: false, code: 'TOOL-COPY', updatedByUserId: fixture.userId })
    const deleteResponse = await app.request(`/emergency-simulation-tools/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(deleteResponse.status).toBe(200)
    expect((await app.request(`/emergency-simulation-tools/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  })
})

afterAll(() => closeDb())
