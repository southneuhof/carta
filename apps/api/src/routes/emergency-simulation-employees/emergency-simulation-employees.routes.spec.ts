import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { emergencySimulationEmployees } from './emergency-simulation-employees.entity'

const crudPermissions = [
  'list-emergency-simulation-employees',
  'detail-emergency-simulation-employees',
  'create-emergency-simulation-employees',
  'update-emergency-simulation-employees',
  'delete-emergency-simulation-employees',
] as const

function id(prefix: string) {
  return `emergency-simulation-employee-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string }
const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Emergency Simulation Employee Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Emergency Simulation Employee Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Emergency Simulation Employee Test Role', realm: 'system' })
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

describe('Karyawan Terlibat Simulasi Tanggap Darurat routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(emergencySimulationEmployees).where(or(eq(emergencySimulationEmployees.createdByUserId, fixture.userId), eq(emergencySimulationEmployees.updatedByUserId, fixture.userId)))
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
    expect((await app.request('/emergency-simulation-employees/list')).status).toBe(401)
    const limited = await makeSession([])
    expect((await app.request('/emergency-simulation-employees/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/emergency-simulation-employees/create', { method: 'POST', headers: jsonHeaders(limited.cookie), body: JSON.stringify({ name: 'Denied' }) })).status).toBe(403)
  })

  it('supports validated audited CRUD', async () => {
    const fixture = await makeSession(crudPermissions)
    const headers = jsonHeaders(fixture.cookie)
    expect((await app.request('/emergency-simulation-employees/create', { method: 'POST', headers, body: JSON.stringify({ name: '   ' }) })).status).toBe(400)
    const createdResponse = await app.request('/emergency-simulation-employees/create', { method: 'POST', headers, body: JSON.stringify({ name: '  Supervisor Copy  ', description: ' Description ', code: '  SUP-COPY  ' }) })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({ name: 'Supervisor Copy', description: 'Description', code: 'SUP-COPY', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    const duplicate = await app.request('/emergency-simulation-employees/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Duplicate', code: 'SUP-COPY' }) })
    expect(duplicate.status).toBe(400)
    const listResponse = await app.request('/emergency-simulation-employees/list?page=1&limit=20', { headers: { Cookie: fixture.cookie } })
    expect(listResponse.status).toBe(200)
    expect((await listResponse.json() as { data: Array<Record<string, unknown>> }).data.some((row) => row.id === created.id && row.name === 'Supervisor Copy')).toBe(true)
    const detailResponse = await app.request(`/emergency-simulation-employees/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })
    expect(detailResponse.status).toBe(200)
    const updateResponse = await app.request(`/emergency-simulation-employees/update/${String(created.id)}`, { method: 'PATCH', headers, body: JSON.stringify({ name: '  Updated Employee  ', description: null, active: false }) })
    expect(updateResponse.status).toBe(200)
    expect((await updateResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ name: 'Updated Employee', description: null, active: false, code: 'SUP-COPY', updatedByUserId: fixture.userId })
    const deleteResponse = await app.request(`/emergency-simulation-employees/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(deleteResponse.status).toBe(200)
    expect((await app.request(`/emergency-simulation-employees/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  })
})

afterAll(() => closeDb())
