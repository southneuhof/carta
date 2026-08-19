import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { permitCategoryApds } from '../permit-category-apd/permit-category-apd.entity'
import { permitApds } from './permit-apd.entity'

const childPermissions = [
  'list-permit-apd',
  'detail-permit-apd',
  'create-permit-apd',
  'update-permit-apd',
  'delete-permit-apd',
] as const

function id(prefix: string) {
  return `permit-apd-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string }
const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Permit APD Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Permit APD Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Permit APD Test Role', realm: 'system' })
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

describe('Permit APD routes', () => {
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

  it('requires authentication and the child permission', async () => {
    expect((await app.request('/permit-apd/list?permitCategoryApdId=missing')).status).toBe(401)
    const limited = await makeSession([])
    expect((await app.request('/permit-apd/list?permitCategoryApdId=missing', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/permit-apd/create', { method: 'POST', headers: jsonHeaders(limited.cookie), body: JSON.stringify({ name: 'Denied' }) })).status).toBe(403)
  })

  it('validates and scopes child CRUD to its category', async () => {
    const fixture = await makeSession(childPermissions)
    const headers = jsonHeaders(fixture.cookie)
    const parentId = id('parent')
    const otherParentId = id('other-parent')
    await getDb().insert(permitCategoryApds).values([
      { id: parentId, name: 'Parent One', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId },
      { id: otherParentId, name: 'Parent Two', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId },
    ])

    expect((await app.request('/permit-apd/list', { headers: { Cookie: fixture.cookie } })).status).toBe(400)
    expect((await app.request('/permit-apd/list?permitCategoryApdId=missing', { headers: { Cookie: fixture.cookie } })).status).toBe(404)
    expect((await app.request('/permit-apd/create', { method: 'POST', headers, body: JSON.stringify({ name: 'Missing Parent' }) })).status).toBe(400)
    expect((await app.request('/permit-apd/create', { method: 'POST', headers, body: JSON.stringify({ permitCategoryApdId: 'missing', name: 'Unknown Parent' }) })).status).toBe(404)
    expect((await app.request('/permit-apd/create', { method: 'POST', headers, body: JSON.stringify({ permitCategoryApdId: parentId, name: 'Invalid Active', active: 'yes' }) })).status).toBe(400)

    const createdResponse = await app.request('/permit-apd/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ permitCategoryApdId: parentId, name: '  Helmet Copy  ', description: 'Description', code: '  APD-COPY  ' }),
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({ permitCategoryApdId: parentId, name: 'Helmet Copy', description: 'Description', code: 'APD-COPY', active: true, createdByUserId: fixture.userId })

    const blankCode = await app.request('/permit-apd/create', { method: 'POST', headers, body: JSON.stringify({ permitCategoryApdId: parentId, name: 'No Code', code: '  ' }) })
    expect(blankCode.status).toBe(201)
    expect((await blankCode.json() as { data: { code: string | null } }).data.code).toBeNull()
    expect((await app.request('/permit-apd/create', { method: 'POST', headers, body: JSON.stringify({ permitCategoryApdId: parentId, name: 'Duplicate', code: 'APD-COPY' }) })).status).toBe(400)

    const list = await app.request(`/permit-apd/list?permitCategoryApdId=${parentId}&page=1&limit=20`, { headers: { Cookie: fixture.cookie } })
    expect(list.status).toBe(200)
    expect((await list.json() as { data: Array<Record<string, unknown>> }).data.every((row) => row.permitCategoryApdId === parentId)).toBe(true)
    const otherList = await app.request(`/permit-apd/list?permitCategoryApdId=${otherParentId}`, { headers: { Cookie: fixture.cookie } })
    expect(otherList.status).toBe(200)
    expect((await otherList.json() as { data: Array<Record<string, unknown>> }).data).toHaveLength(0)

    const idValue = String(created.id)
    expect((await app.request(`/permit-apd/detail/${idValue}?permitCategoryApdId=${otherParentId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
    expect((await app.request(`/permit-apd/update/${idValue}?permitCategoryApdId=${otherParentId}`, { method: 'PATCH', headers, body: JSON.stringify({ name: 'Leaked Update' }) })).status).toBe(404)
    expect((await app.request(`/permit-apd/delete/${idValue}?permitCategoryApdId=${otherParentId}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const update = await app.request(`/permit-apd/update/${idValue}?permitCategoryApdId=${parentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: '  Updated Helmet  ', description: null, active: false, permitCategoryApdId: otherParentId }),
    })
    expect(update.status).toBe(200)
    expect((await update.json() as { data: Record<string, unknown> }).data).toMatchObject({ name: 'Updated Helmet', description: null, active: false, permitCategoryApdId: parentId })

    const deleted = await app.request(`/permit-apd/delete/${idValue}?permitCategoryApdId=${parentId}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(deleted.status).toBe(200)
    expect((await app.request(`/permit-apd/detail/${idValue}?permitCategoryApdId=${parentId}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
    const otherRows = await getDb().select({ id: permitApds.id }).from(permitApds).where(eq(permitApds.permitCategoryApdId, otherParentId))
    expect(otherRows).toHaveLength(0)
  }, 20_000)
})

afterAll(() => closeDb())
