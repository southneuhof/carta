import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { tollCausesAccidents, tollCausesAccidentsCategories } from './toll-causes-accidents.entity'

const crudPermissions = [
  'list-toll-causes-accidents',
  'detail-toll-causes-accidents',
  'create-toll-causes-accidents',
  'update-toll-causes-accidents',
  'delete-toll-causes-accidents',
] as const

function id(prefix: string) {
  return `toll-causes-accidents-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string; categoryIds: string[] }
const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const categoryIds = [id('driver-category'), id('vehicle-category')]
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Toll Causes Accidents Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Toll Causes Accidents Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Toll Causes Accidents Test Role', realm: 'system' })
  await db.insert(tollCausesAccidentsCategories).values([
    { id: categoryIds[0], name: 'Pengemudi', code: 'driver' },
    { id: categoryIds[1], name: 'Kendaraan', code: 'vehicle' },
  ]).onConflictDoNothing()
  for (const permissionCode of permissionCodes) {
    await db.insert(permissions).values({ id: id(permissionCode), permissionCode, name: permissionCode, moduleId }).onConflictDoNothing()
    const permission = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, permissionCode)).limit(1))[0]
    if (!permission) throw new Error(`Permission fixture is missing: ${permissionCode}`)
    await db.insert(rolePermissions).values({ roleId, permissionId: permission.id })
  }
  await db.insert(systemRoleAssignments).values({ userId, roleId })
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  const fixture = { userId, moduleId, roleId, cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '', categoryIds }
  fixtures.push(fixture)
  return fixture
}

function jsonHeaders(cookie: string) {
  return { 'Content-Type': 'application/json', Cookie: cookie }
}

describe('Faktor Kecelakaan routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(tollCausesAccidents).where(or(eq(tollCausesAccidents.createdByUserId, fixture.userId), eq(tollCausesAccidents.updatedByUserId, fixture.userId)))
      await db.delete(tollCausesAccidentsCategories).where(or(...fixture.categoryIds.map((categoryId) => eq(tollCausesAccidentsCategories.id, categoryId))))
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
    expect((await app.request('/toll-causes-accidents/list')).status).toBe(401)
    const limited = await makeSession([])
    expect((await app.request('/toll-causes-accidents/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/toll-causes-accidents/create', { method: 'POST', headers: jsonHeaders(limited.cookie), body: JSON.stringify({ categoryCode: 'driver', name: 'Denied' }) })).status).toBe(403)
  })

  it('filters by category and supports validated audited CRUD', async () => {
    const fixture = await makeSession(crudPermissions)
    const headers = jsonHeaders(fixture.cookie)
    expect((await app.request('/toll-causes-accidents/create', { method: 'POST', headers, body: JSON.stringify({ categoryCode: 'missing', name: 'Invalid' }) })).status).toBe(400)
    const createdResponse = await app.request('/toll-causes-accidents/create', { method: 'POST', headers, body: JSON.stringify({ categoryCode: 'driver', name: '  Kurang Antisipasi Copy  ', description: ' Description ', code: '  DRIVER-COPY  ' }) })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({ categoryCode: 'driver', category: { code: 'driver', name: 'Pengemudi' }, name: 'Kurang Antisipasi Copy', description: 'Description', code: 'DRIVER-COPY', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    const duplicate = await app.request('/toll-causes-accidents/create', { method: 'POST', headers, body: JSON.stringify({ categoryCode: 'driver', name: 'Duplicate', code: 'DRIVER-COPY' }) })
    expect(duplicate.status).toBe(400)
    const driverList = await app.request('/toll-causes-accidents/list?page=1&limit=20&categoryCode=driver', { headers: { Cookie: fixture.cookie } })
    expect(driverList.status).toBe(200)
    const driverRows = (await driverList.json() as { data: Array<Record<string, unknown>> }).data
    expect(driverRows.some((row) => row.id === created.id)).toBe(true)
    expect(driverRows.find((row) => row.id === created.id)).toMatchObject({ category: { code: 'driver', name: 'Pengemudi' } })
    const vehicleList = await app.request('/toll-causes-accidents/list?page=1&limit=20&categoryCode=vehicle', { headers: { Cookie: fixture.cookie } })
    expect(vehicleList.status).toBe(200)
    expect((await vehicleList.json() as { data: Array<Record<string, unknown>> }).data.some((row) => row.id === created.id)).toBe(false)
    const detailResponse = await app.request(`/toll-causes-accidents/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })
    expect(detailResponse.status).toBe(200)
    expect((await detailResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ category: { code: 'driver', name: 'Pengemudi' } })
    const updateResponse = await app.request(`/toll-causes-accidents/update/${String(created.id)}`, { method: 'PATCH', headers, body: JSON.stringify({ categoryCode: 'vehicle', name: '  Updated Cause  ', description: null, active: false }) })
    expect(updateResponse.status).toBe(200)
    expect((await updateResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ categoryCode: 'vehicle', category: { code: 'vehicle', name: 'Kendaraan' }, name: 'Updated Cause', description: null, active: false, updatedByUserId: fixture.userId })
    expect((await app.request(`/toll-causes-accidents/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/toll-causes-accidents/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  })
})

afterAll(() => closeDb())
