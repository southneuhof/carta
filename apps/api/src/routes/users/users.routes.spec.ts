import { afterAll, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { permissions, roleGroups, rolePermissions, roles, userRoles } from '../roles/roles.entity'
import { users } from './users.entity'

function id(prefix: string) {
  return `user-create-test-${prefix}-${crypto.randomUUID()}`
}

async function session(withPermission: boolean) {
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
  if (withPermission) {
    const groupId = id('group')
    const roleId = id('role')
    const permissionId = id('permission')
    await db.insert(roleGroups).values({ id: groupId, roleGroupCode: id('group-code'), name: 'Test Group' })
    await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Test Role', roleGroupId: groupId })
    await db.insert(permissions).values({ id: permissionId, permissionCode: 'create-users', name: 'Create users', permissionGroup: 'administration' }).onConflictDoNothing()
    const permission = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, 'create-users')).limit(1)
    await db.insert(rolePermissions).values({ roleId, permissionId: permission[0]!.id })
    await db.insert(userRoles).values({ userId, roleId })
  }
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  return signedIn.headers.get('set-cookie')?.split(';')[0] ?? ''
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
    const cookie = await session(true)
    const response = await request({ name: 'Created User', username: id('username'), email: `${id('created')}@example.invalid`, password: 'password-123' }, cookie)

    expect(response.status).toBe(201)
    expect((await response.json()).data).toMatchObject({ name: 'Created User' })
  })

  it('rejects invalid input at the route boundary', async () => {
    const response = await request({ name: '', username: 'invalid', email: 'not-an-email', password: 'short' }, await session(true))

    expect(response.status).toBe(400)
  })

  it('rejects duplicate usernames', async () => {
    const cookie = await session(true)
    const username = id('duplicate')
    const first = { name: 'First User', username, email: `${id('first')}@example.invalid`, password: 'password-123' }
    expect((await request(first, cookie)).status).toBe(201)

    const second = await request({ ...first, email: `${id('second')}@example.invalid` }, cookie)
    expect(second.status).toBe(409)
  })

  it('requires create-users permission', async () => {
    expect((await request({})).status).toBe(401)
    expect((await request({}, await session(false))).status).toBe(403)
  })
})
