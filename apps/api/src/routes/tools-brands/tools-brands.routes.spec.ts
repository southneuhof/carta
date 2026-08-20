import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { toolsBrands } from './tools-brands.entity'

const crudPermissions = ['list-tools-brands', 'detail-tools-brands', 'create-tools-brands', 'update-tools-brands', 'delete-tools-brands'] as const
const fixtures: Array<{ userId: string; moduleId: string; roleId: string; cookie: string }> = []

function id(prefix: string) {
  return `tools-brands-test-${prefix}-${crypto.randomUUID()}`
}

async function makeSession(permissionCodes: readonly string[]) {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Tools Brands Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Tools Brands Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Tools Brands Test Role', realm: 'system' })
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

describe('Merk Alat Berat & Alat Ukur/Uji routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(toolsBrands).where(or(eq(toolsBrands.createdByUserId, fixture.userId), eq(toolsBrands.updatedByUserId, fixture.userId)))
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
    expect((await app.request('/tools-brands/list')).status).toBe(401)
    const limited = await makeSession([])
    expect((await app.request('/tools-brands/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/tools-brands/create', { method: 'POST', headers: jsonHeaders(limited.cookie), body: JSON.stringify({ categoryCode: 'heavy-equipments', name: 'Denied' }) })).status).toBe(403)
  })

  it('filters by category and supports validated audited CRUD', async () => {
    const fixture = await makeSession(crudPermissions)
    const headers = jsonHeaders(fixture.cookie)
    expect((await app.request('/tools-brands/create', { method: 'POST', headers, body: JSON.stringify({ categoryCode: 'invalid', name: 'Invalid' }) })).status).toBe(400)
    const createdResponse = await app.request('/tools-brands/create', { method: 'POST', headers, body: JSON.stringify({ categoryCode: 'heavy-equipments', name: '  Brand Copy  ', description: ' Description ' }) })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({ categoryCode: 'heavy-equipments', name: 'Brand Copy', description: 'Description', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    const heavy = await app.request('/tools-brands/list?page=1&limit=20&categoryCode=heavy-equipments', { headers: { Cookie: fixture.cookie } })
    expect((await heavy.json() as { data: Array<Record<string, unknown>> }).data.some((row) => row.id === created.id)).toBe(true)
    const measuring = await app.request('/tools-brands/list?page=1&limit=20&categoryCode=measuring-instruments', { headers: { Cookie: fixture.cookie } })
    expect((await measuring.json() as { data: Array<Record<string, unknown>> }).data.some((row) => row.id === created.id)).toBe(false)
    const updateResponse = await app.request(`/tools-brands/update/${String(created.id)}`, { method: 'PATCH', headers, body: JSON.stringify({ categoryCode: 'measuring-instruments', name: '  Updated Brand  ', active: false }) })
    expect(updateResponse.status).toBe(200)
    expect((await updateResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ categoryCode: 'measuring-instruments', name: 'Updated Brand', active: false, updatedByUserId: fixture.userId })
    expect((await app.request(`/tools-brands/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/tools-brands/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  })
})

afterAll(() => closeDb())
