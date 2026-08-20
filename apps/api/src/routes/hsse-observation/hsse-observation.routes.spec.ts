import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { getAuth } from '../auth/auth'
import { accounts, sessions } from '../auth/auth.entity'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { findingCategories, findingCauses, findingCriteria, findingTypes } from './hsse-observation.entity'

const crudPermissions = [
  'list-finding-criteria',
  'detail-finding-criteria',
  'create-finding-criteria',
  'update-finding-criteria',
  'delete-finding-criteria',
  'list-finding-types',
  'detail-finding-types',
  'create-finding-types',
  'update-finding-types',
  'delete-finding-types',
  'list-finding-categories',
  'detail-finding-categories',
  'create-finding-categories',
  'update-finding-categories',
  'delete-finding-categories',
  'list-finding-cause',
  'detail-finding-cause',
  'create-finding-cause',
  'update-finding-cause',
  'delete-finding-cause',
] as const

function id(prefix: string) {
  return `hsse-observation-test-${prefix}-${crypto.randomUUID()}`
}

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string }
const fixtures: Fixture[] = []

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'HSSE Observation Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'HSSE Observation Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'HSSE Observation Test Role', realm: 'system' })
  for (const permissionCode of permissionCodes) {
    await db.insert(permissions).values({ id: id('permission'), permissionCode, name: permissionCode, moduleId }).onConflictDoNothing()
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

describe('HSSE observation routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(findingCauses).where(or(eq(findingCauses.createdByUserId, fixture.userId), eq(findingCauses.updatedByUserId, fixture.userId)))
      await db.delete(findingCategories).where(or(eq(findingCategories.createdByUserId, fixture.userId), eq(findingCategories.updatedByUserId, fixture.userId)))
      await db.delete(findingTypes).where(or(eq(findingTypes.createdByUserId, fixture.userId), eq(findingTypes.updatedByUserId, fixture.userId)))
      await db.delete(findingCriteria).where(or(eq(findingCriteria.createdByUserId, fixture.userId), eq(findingCriteria.updatedByUserId, fixture.userId)))
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

  it('keeps resource permission families separate', async () => {
    expect((await app.request('/finding-criteria/list')).status).toBe(401)
    const limited = await makeSession(['list-finding-types'])
    expect((await app.request('/finding-types/list?page=1&limit=20', { headers: { Cookie: limited.cookie } })).status).toBe(200)
    expect((await app.request('/finding-categories/list?page=1&limit=20', { headers: { Cookie: limited.cookie } })).status).toBe(403)
  })

  it('supports filtered parent CRUD and relation metadata', async () => {
    const fixture = await makeSession(crudPermissions)
    const headers = jsonHeaders(fixture.cookie)
    const db = getDb()
    await db.insert(findingCriteria).values({ id: id('criteria'), name: 'Negatif', code: 'negative', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    const criteria = (await db.select({ id: findingCriteria.id }).from(findingCriteria).where(eq(findingCriteria.code, 'negative')).limit(1))[0]
    if (!criteria) throw new Error('Finding criteria fixture is missing.')
    const typeId = id('type')
    await db.insert(findingTypes).values({ id: typeId, findingCriteriaCode: 'negative', name: 'Unsafe Action', code: id('type-code'), displayOrder: 1, active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })

    const listResponse = await app.request('/finding-types/list?findingCriteriaCode=negative&page=1&limit=20', { headers: { Cookie: fixture.cookie } })
    expect(listResponse.status).toBe(200)
    const list = await listResponse.json() as { data: Array<Record<string, any>> }
    expect(list.data.find((row) => row.id === typeId)).toMatchObject({ findingCriteriaCode: 'negative', findingCriteria: { code: 'negative', name: 'Negatif' } })

    const categoryResponse = await app.request('/finding-categories/create', { method: 'POST', headers, body: JSON.stringify({ findingTypeId: typeId, name: 'Procedure', code: 'test-procedure', description: 'Procedure' }) })
    expect(categoryResponse.status).toBe(201)
    const category = (await categoryResponse.json() as { data: Record<string, any> }).data
    expect(category).toMatchObject({ findingTypeId: typeId, code: 'test-procedure', findingType: { id: typeId, name: 'Unsafe Action' } })

    const invalidCause = await app.request('/finding-cause/create', { method: 'POST', headers, body: JSON.stringify({ findingCategoryId: id('missing-category'), name: 'Cause', code: 'missing-parent' }) })
    expect(invalidCause.status).toBe(400)

    const causeResponse = await app.request('/finding-cause/create', { method: 'POST', headers, body: JSON.stringify({ findingCategoryId: category.id, name: 'No procedure', code: 'test-no-procedure' }) })
    expect(causeResponse.status).toBe(201)
    const cause = (await causeResponse.json() as { data: Record<string, any> }).data
    expect(cause).toMatchObject({ findingCategoryId: category.id, findingCategory: { id: category.id, name: 'Procedure' } })

    const scoped = await app.request(`/finding-categories/list?findingTypeId=${typeId}&page=1&limit=20`, { headers: { Cookie: fixture.cookie } })
    expect(scoped.status).toBe(200)
    expect((await scoped.json() as { data: Array<Record<string, unknown>> }).data).toHaveLength(1)

    const duplicate = await app.request('/finding-categories/create', { method: 'POST', headers, body: JSON.stringify({ findingTypeId: typeId, name: 'Duplicate', code: 'test-procedure' }) })
    expect(duplicate.status).toBe(400)

    const update = await app.request(`/finding-categories/update/${category.id}`, { method: 'PATCH', headers, body: JSON.stringify({ name: 'Updated Procedure' }) })
    expect(update.status).toBe(200)
    expect((await update.json() as { data: Record<string, any> }).data).toMatchObject({ name: 'Updated Procedure', findingType: { id: typeId } })

    expect((await app.request(`/finding-cause/delete/${cause.id}`, { method: 'DELETE', headers })).status).toBe(200)
    expect((await app.request(`/finding-cause/detail/${cause.id}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
  }, 20_000)
})

afterAll(() => closeDb())
