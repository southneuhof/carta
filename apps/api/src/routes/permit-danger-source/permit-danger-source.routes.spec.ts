import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { permitDangerSources } from './permit-danger-source.entity'

const crudPermissions = [
  'list-permit-danger-source',
  'detail-permit-danger-source',
  'create-permit-danger-source',
  'update-permit-danger-source',
  'delete-permit-danger-source',
] as const

function id(prefix: string) {
  return `permit-danger-source-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = {
  userId: string
  moduleId: string
  roleId: string
  cookie: string
}

const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`

  await db.insert(users).values({ id: userId, name: 'Permit Danger Source Test User', email })
  await db.insert(accounts).values({
    id: id('account'),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: await hashPassword('test-password'),
  })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Permit Danger Source Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Permit Danger Source Test Role', realm: 'system' })

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

describe('permit danger source routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(permitDangerSources).where(or(
        eq(permitDangerSources.createdByUserId, fixture.userId),
        eq(permitDangerSources.updatedByUserId, fixture.userId),
      ))
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

  it('requires a session and the operation permission', async () => {
    expect((await app.request('/permit-danger-source/list')).status).toBe(401)

    const limited = await makeSession([])
    expect((await app.request('/permit-danger-source/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/permit-danger-source/create', {
      method: 'POST',
      headers: jsonHeaders(limited.cookie),
      body: JSON.stringify({ name: 'Denied' }),
    })).status).toBe(403)
  })

  it('supports validated audited CRUD and nullable unique codes', async () => {
    const fixture = await makeSession(crudPermissions)
    const headers = jsonHeaders(fixture.cookie)

    const invalidName = await app.request('/permit-danger-source/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '   ' }),
    })
    expect(invalidName.status).toBe(400)

    const invalidActive = await app.request('/permit-danger-source/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Invalid Active', active: 'yes' }),
    })
    expect(invalidActive.status).toBe(400)

    const createdResponse = await app.request('/permit-danger-source/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '  Listrik Copy  ', description: 'Description', code: '  LS-COPY  ' }),
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({
      name: 'Listrik Copy',
      code: 'LS-COPY',
      description: 'Description',
      active: true,
      createdByUserId: fixture.userId,
      updatedByUserId: fixture.userId,
    })
    expect(created.createdAt).toEqual(expect.any(String))
    expect(created.updatedAt).toEqual(expect.any(String))

    const blankCodeResponse = await app.request('/permit-danger-source/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'No Code', code: '  ' }),
    })
    expect(blankCodeResponse.status).toBe(201)
    expect((await blankCodeResponse.json() as { data: { code: string | null } }).data.code).toBeNull()

    const duplicateCode = await app.request('/permit-danger-source/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Duplicate Code', code: 'LS-COPY' }),
    })
    expect(duplicateCode.status).toBe(400)

    const listResponse = await app.request('/permit-danger-source/list?page=1&limit=20', { headers: { Cookie: fixture.cookie } })
    expect(listResponse.status).toBe(200)
    const listed = await listResponse.json() as { data: Array<Record<string, unknown>> }
    expect(listed.data.some((row) => row.id === created.id && row.name === 'Listrik Copy')).toBe(true)

    const detailResponse = await app.request(`/permit-danger-source/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })
    expect(detailResponse.status).toBe(200)
    expect((await detailResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ id: created.id, name: 'Listrik Copy' })

    const updateResponse = await app.request(`/permit-danger-source/update/${String(created.id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: '  Updated Danger Source ', description: null, active: false, code: ' UPDATED ' }),
    })
    expect(updateResponse.status).toBe(200)
    const updated = (await updateResponse.json() as { data: Record<string, unknown> }).data
    expect(updated).toMatchObject({
      name: 'Updated Danger Source',
      description: null,
      active: false,
      code: 'UPDATED',
      updatedByUserId: fixture.userId,
    })

    const partialUpdateResponse = await app.request(`/permit-danger-source/update/${String(created.id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ description: 'Updated description' }),
    })
    expect(partialUpdateResponse.status).toBe(200)
    expect((await partialUpdateResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({
      name: 'Updated Danger Source',
      description: 'Updated description',
      active: false,
      code: 'UPDATED',
    })

    const deleteResponse = await app.request(`/permit-danger-source/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(deleteResponse.status).toBe(200)
    expect((await app.request(`/permit-danger-source/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  }, 20_000)
})

afterAll(() => closeDb())
