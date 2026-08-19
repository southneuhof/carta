import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { permitApds } from '../permit-apd/permit-apd.entity'
import { permitCategoryApds } from './permit-category-apd.entity'

const parentPermissions = [
  'list-permit-category-apd',
  'detail-permit-category-apd',
  'create-permit-category-apd',
  'update-permit-category-apd',
  'delete-permit-category-apd',
] as const

function id(prefix: string) {
  return `permit-category-apd-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string }
const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Permit Category APD Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Permit Category APD Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Permit Category APD Test Role', realm: 'system' })
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

describe('Permit Category APD routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(permitApds).where(or(eq(permitApds.createdByUserId, fixture.userId), eq(permitApds.updatedByUserId, fixture.userId)))
      await db.delete(permitCategoryApds).where(or(eq(permitCategoryApds.createdByUserId, fixture.userId), eq(permitCategoryApds.updatedByUserId, fixture.userId)))
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

  it('requires authentication and the operation permission', async () => {
    expect((await app.request('/permit-category-apd/list')).status).toBe(401)
    const limited = await makeSession([])
    expect((await app.request('/permit-category-apd/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/permit-category-apd/create', { method: 'POST', headers: jsonHeaders(limited.cookie), body: JSON.stringify({ name: 'Denied' }) })).status).toBe(403)
  })

  it('supports audited CRUD and blocks deleting a category with APD children', async () => {
    const fixture = await makeSession(parentPermissions)
    const headers = jsonHeaders(fixture.cookie)
    expect((await app.request('/permit-category-apd/create', { method: 'POST', headers, body: JSON.stringify({ name: '   ' }) })).status).toBe(400)
    expect((await app.request('/permit-category-apd/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Bad Active', active: 'yes' }) })).status).toBe(400)

    const createdResponse = await app.request('/permit-category-apd/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '  Kepala Copy  ', description: 'Description', code: '  KC-COPY  ' }),
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({ name: 'Kepala Copy', description: 'Description', code: 'KC-COPY', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })

    const duplicateCode = await app.request('/permit-category-apd/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Duplicate', code: 'KC-COPY' }) })
    expect(duplicateCode.status).toBe(400)
    const list = await app.request('/permit-category-apd/list?page=1&limit=20', { headers: { Cookie: fixture.cookie } })
    expect(list.status).toBe(200)
    expect((await list.json() as { data: Array<Record<string, unknown>> }).data.some((row) => row.id === created.id)).toBe(true)

    const detail = await app.request(`/permit-category-apd/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })
    expect(detail.status).toBe(200)
    expect((await detail.json() as { data: Record<string, unknown> }).data).toMatchObject({ id: created.id, name: 'Kepala Copy' })

    const update = await app.request(`/permit-category-apd/update/${String(created.id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: '  Updated Category  ', description: null, active: false, code: ' UPDATED ' }),
    })
    expect(update.status).toBe(200)
    expect((await update.json() as { data: Record<string, unknown> }).data).toMatchObject({ name: 'Updated Category', description: null, active: false, code: 'UPDATED', updatedByUserId: fixture.userId })

    const childId = id('child')
    await getDb().insert(permitApds).values({ id: childId, permitCategoryApdId: String(created.id), name: 'Helmet', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    const blocked = await app.request(`/permit-category-apd/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(blocked.status).toBe(400)
    expect((await getDb().select({ id: permitCategoryApds.id }).from(permitCategoryApds).where(eq(permitCategoryApds.id, String(created.id)))).length).toBe(1)

    await getDb().delete(permitApds).where(eq(permitApds.id, childId))
    const deleted = await app.request(`/permit-category-apd/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(deleted.status).toBe(200)
    expect((await app.request(`/permit-category-apd/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  }, 20_000)
})

afterAll(() => closeDb())
