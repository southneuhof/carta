import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../authorization', async () => {
  const actual = await vi.importActual<typeof import('../../authorization')>('../../authorization')
  return { ...actual, assignInitialSystemRoles: vi.fn().mockRejectedValue(new Error('forced assignment failure')) }
})

import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { users } from './users.entity'
import { assignInitialSystemRoles } from '../../authorization'

function id(prefix: string) {
  return `user-compensation-test-${prefix}-${crypto.randomUUID()}`
}

async function adminSession() {
  const db = getDb()
  const userId = id('admin')
  const email = `${userId}@example.invalid`
  const moduleId = id('module')
  const roleId = id('role')
  await db.insert(users).values({ id: userId, name: 'Compensation Admin', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Users', realm: 'system' })
  await db.insert(permissions).values({ id: id('permission'), permissionCode: 'create-users', name: 'Create Users', moduleId }).onConflictDoNothing()
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Compensation Admin Role', realm: 'system' })
  const permission = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.permissionCode, 'create-users')).limit(1))[0]!
  await db.insert(systemRoleAssignments).values({ userId, roleId })
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
    const moduleId = id('target-module')
    const email = `${id('created')}@example.invalid`
    await db.insert(authorizationModules).values({ id: moduleId, code: id('target-module-code'), name: 'Target', realm: 'system' })
    await db.insert(roles).values({ id: roleId, roleCode: id('target-role-code'), name: 'Target Role', realm: 'system' })

    const response = await app.request('/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: state.cookie },
      body: JSON.stringify({ name: 'Created Then Removed', username: id('username'), email, password: 'password-123', systemRoleIds: [roleId] }),
    })
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe('user_create_failed')
    const assignmentCalls = vi.mocked(assignInitialSystemRoles).mock.calls
    expect(assignmentCalls).toHaveLength(1)
    const createdUserId = assignmentCalls[0]?.[1]
    if (!createdUserId) throw new Error('The compensation test did not receive the created user ID.')
    expect(await db.select({ id: users.id }).from(users).where(eq(users.id, createdUserId))).toHaveLength(0)
    expect(await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, createdUserId))).toHaveLength(0)
    expect(await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, createdUserId))).toHaveLength(0)
    expect(await db.select({ roleId: systemRoleAssignments.roleId }).from(systemRoleAssignments).where(eq(systemRoleAssignments.userId, createdUserId))).toHaveLength(0)
  })
})
