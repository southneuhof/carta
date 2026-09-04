import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('../roles/roles.service', async () => {
  const actual = await vi.importActual<typeof import('../roles/roles.service')>('../roles/roles.service')
  return { ...actual, assignInitialRoles: vi.fn().mockRejectedValue(new Error('forced assignment failure')) }
})

import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { permissions, rolePermissions, roles, roleAssignments } from '../roles/roles.entity'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { users } from './users.entity'
import { assignInitialRoles } from '../roles/roles.service'

function id(prefix: string) {
  return `user-compensation-test-${prefix}-${crypto.randomUUID()}`
}

async function adminSession() {
  const db = getDb()
  const userId = id('admin')
  const email = `${userId}@example.invalid`
  const roleId = id('role')
  await db.insert(users).values({ id: userId, name: 'Compensation Admin', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(permissions).values({ id: id('permission'), permissionCode: 'create-users', name: 'Create Users' }).onConflictDoNothing()
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Compensation Admin Role' })
  const permission = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, 'create-users')).limit(1))[0]!
  await db.insert(roleAssignments).values({ userId, roleId })
  await db.insert(rolePermissions).values({ roleId, permissionId: permission.id })
  const signedIn = await getAuth().api.signInEmail({ body: { email, password: 'test-password' }, returnHeaders: true })
  return { cookie: signedIn.headers.get('set-cookie')?.split(';')[0] ?? '' }
}

describe('user creation compensation', () => {
  afterAll(() => closeDb())

  it('removes all Better Auth and assignment rows after post-create failure', async () => {
    const state = await adminSession()
    const db = getDb()
    const roleId = id('target-role')
    const email = `${id('created')}@example.invalid`
    await db.insert(roles).values({ id: roleId, roleCode: id('target-role-code'), name: 'Target Role' })

    const response = await app.request('/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: state.cookie },
      body: JSON.stringify({ name: 'Created Then Removed', email, password: 'password-123', roleIds: [roleId] }),
    })
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe('user_create_failed')
    const assignmentCalls = vi.mocked(assignInitialRoles).mock.calls
    expect(assignmentCalls).toHaveLength(1)
    const createdUserId = assignmentCalls[0]?.[1]
    if (!createdUserId) throw new Error('The compensation test did not receive the created user ID.')
    expect(await db.select({ id: users.id }).from(users).where(eq(users.id, createdUserId))).toHaveLength(0)
    expect(await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, createdUserId))).toHaveLength(0)
    expect(await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, createdUserId))).toHaveLength(0)
    expect(await db.select({ roleId: roleAssignments.roleId }).from(roleAssignments).where(eq(roleAssignments.userId, createdUserId))).toHaveLength(0)
  })
})
