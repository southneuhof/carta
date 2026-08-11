import { afterAll, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from './users.entity'

function id(prefix: string) {
  return `user-create-test-${prefix}-${crypto.randomUUID()}`
}

async function session(withPermission: boolean, permissionCodes = ['create-users']) {
  const db = getDb()
  const userId = id(withPermission ? 'admin' : 'limited')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Test User', email })
  await db.insert(accounts).values({
    id: id('account'),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: await hashPassword('test-password'),
  })
  let roleId: string | undefined
  if (withPermission) {
    roleId = id('role')
    const moduleId = id('module')
    await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Test Module', realm: 'system' })
    await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Test Role', realm: 'system' })
    for (const permissionCode of permissionCodes) {
      await db.insert(permissions).values({ id: `permission-${permissionCode}-${crypto.randomUUID()}`, permissionCode, name: permissionCode, moduleId }).onConflictDoNothing()
      const permission = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, permissionCode)).limit(1)
      await db.insert(rolePermissions).values({ roleId, permissionId: permission[0]!.id })
    }
    await db.insert(systemRoleAssignments).values({ userId, roleId })
  }
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  return { cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '', roleId, userId }
}

function request(body: unknown, cookie = '') {
  return app.request('/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  })
}

describe('user credential creation route', () => {
  afterAll(() => closeDb())

  it('creates a user with a valid credential payload', async () => {
    const sessionState = await session(true)
    const secondRoleId = id('second-role')
    await getDb().insert(roles).values({ id: secondRoleId, roleCode: id('second-role-code'), name: 'Second Role', realm: 'system' })
    const response = await request({ name: 'Created User', username: id('username'), email: `${id('created')}@example.invalid`, password: 'password-123', systemRoleIds: [sessionState.roleId!, secondRoleId] }, sessionState.cookie)

    expect(response.status).toBe(201)
    const user = (await response.json()).data
    expect(user).toMatchObject({ name: 'Created User' })
    expect(await getDb().select({ roleId: systemRoleAssignments.roleId }).from(systemRoleAssignments).where(eq(systemRoleAssignments.userId, user.id))).toHaveLength(2)
  })

  it('rejects invalid input at the route boundary', async () => {
    const sessionState = await session(true)
    const response = await request({ name: '', username: 'invalid', email: 'not-an-email', password: 'short', systemRoleIds: [sessionState.roleId!] }, sessionState.cookie)

    expect(response.status).toBe(400)
  })

  it('rejects duplicate usernames', async () => {
    const sessionState = await session(true)
    const username = id('duplicate')
    const first = { name: 'First User', username, email: `${id('first')}@example.invalid`, password: 'password-123', systemRoleIds: [sessionState.roleId!] }
    expect((await request(first, sessionState.cookie)).status).toBe(201)

    const second = await request({ ...first, email: `${id('second')}@example.invalid` }, sessionState.cookie)
    expect(second.status).toBe(409)
  })

  it('requires create-users permission', async () => {
    expect((await request({})).status).toBe(401)
    expect((await request({}, (await session(false)).cookie)).status).toBe(403)
  })

  it('rejects duplicate, missing, inactive, and project initial roles before account creation', async () => {
    const sessionState = await session(true)
    const inactiveRoleId = id('inactive-role')
    const projectRoleId = id('project-role')
    await getDb().insert(roles).values([
      { id: inactiveRoleId, roleCode: id('inactive-role-code'), name: 'Inactive Role', realm: 'system', active: false },
      { id: projectRoleId, roleCode: id('project-role-code'), name: 'Project Role', realm: 'project' },
    ])
    const cases = [
      { roleIds: [sessionState.roleId!, sessionState.roleId!], status: 400 },
      { roleIds: [id('missing-role')], status: 422 },
      { roleIds: [inactiveRoleId], status: 422 },
      { roleIds: [projectRoleId], status: 422 },
    ]
    for (const testCase of cases) {
      const email = `${id('rejected')}@example.invalid`
      const response = await request({ name: 'Rejected User', username: id('rejected-username'), email, password: 'password-123', systemRoleIds: testCase.roleIds }, sessionState.cookie)
      expect(response.status).toBe(testCase.status)
      expect(await getDb().select({ id: users.id }).from(users).where(eq(users.email, email))).toHaveLength(0)
    }
  })

  it('deletes sessions when an active user is disabled', async () => {
    const sessionState = await session(true, ['create-users', 'update-users'])
    const before = await getDb().select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, sessionState.userId))
    expect(before).toHaveLength(1)
    const response = await app.request(`/users/update/${sessionState.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionState.cookie },
      body: JSON.stringify({ statusCode: 'inactive' }),
    })
    expect(response.status).toBe(200)
    expect(await getDb().select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, sessionState.userId))).toHaveLength(0)
    expect((await app.request('/me', { headers: { Cookie: sessionState.cookie } })).status).toBe(401)
  })
})
