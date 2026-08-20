import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { lawReferenceCategories, lawReferenceItems } from './law-reference-items.entity'
import { seedLawReferenceCategories } from './law-reference-items.seed'

const permissionsForModule = [
  'list-law-reference-items',
  'detail-law-reference-items',
  'create-law-reference-items',
  'update-law-reference-items',
  'delete-law-reference-items',
] as const

type Fixture = { userId: string; moduleId: string; roleId: string; cookie: string }
const fixtures: Fixture[] = []

function id(prefix: string) {
  return `law-reference-test-${prefix}-${crypto.randomUUID()}`
}

async function makeSession(permissionCodes: readonly string[]): Promise<Fixture> {
  const db = getDb()
  const userId = id('user')
  const moduleId = id('module')
  const roleId = id('role')
  const email = `${userId}@example.invalid`
  await db.insert(users).values({ id: userId, name: 'Law Reference Test User', email })
  await db.insert(accounts).values({ id: id('account'), accountId: userId, providerId: 'credential', userId, password: await hashPassword('test-password') })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Law Reference Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Law Reference Test Role', realm: 'system' })
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

function dataOf(response: Response) {
  return response.json() as Promise<{ data: Record<string, any> }>
}

describe('Law reference items routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(lawReferenceItems).where(or(eq(lawReferenceItems.createdByUserId, fixture.userId), eq(lawReferenceItems.updatedByUserId, fixture.userId), eq(lawReferenceItems.deletedByUserId, fixture.userId)))
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

  it('seeds the three fixed categories idempotently', async () => {
    await seedLawReferenceCategories()
    await seedLawReferenceCategories()
    const rows = await getDb().select({ name: lawReferenceCategories.name, code: lawReferenceCategories.code }).from(lawReferenceCategories).where(or(
      eq(lawReferenceCategories.code, 'environment'),
      eq(lawReferenceCategories.code, 'k3'),
      eq(lawReferenceCategories.code, 'security'),
    ))
    expect(rows).toEqual(expect.arrayContaining([
      { name: 'Lingkungan', code: 'environment' },
      { name: 'K3', code: 'k3' },
      { name: 'Pengamanan', code: 'security' },
    ]))
  })

  it('requires authentication and each item permission', async () => {
    await seedLawReferenceCategories()
    expect((await app.request('/law-reference-items/list')).status).toBe(401)
    expect((await app.request('/law-reference-items/tree?lawReferenceCategoryCode=environment')).status).toBe(401)
    const limited = await makeSession([])
    const headers = jsonHeaders(limited.cookie)
    expect((await app.request('/law-reference-items/list', { headers })).status).toBe(403)
    expect((await app.request('/law-reference-items/tree?lawReferenceCategoryCode=environment', { headers })).status).toBe(403)
    expect((await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Denied', type: 'reference' }) })).status).toBe(403)
    expect((await app.request('/law-reference-items/detail/unknown', { headers })).status).toBe(403)
    expect((await app.request('/law-reference-items/update/unknown', { method: 'PATCH', headers, body: '{}' })).status).toBe(403)
    expect((await app.request('/law-reference-items/delete/unknown', { method: 'DELETE', headers })).status).toBe(403)
  })

  it('validates the tree, returns relations, filters lookup rows, and soft-deletes descendants', async () => {
    await seedLawReferenceCategories()
    const fixture = await makeSession(permissionsForModule)
    const headers = jsonHeaders(fixture.cookie)

    expect((await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Missing type' }) })).status).toBe(400)
    expect((await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Wrong level', type: 'reference', level: 2 }) })).status).toBe(400)

    const rootResponse = await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Temporary law root', type: 'reference' }) })
    expect(rootResponse.status).toBe(201)
    const root = (await dataOf(rootResponse)).data
    expect(root).toMatchObject({ name: 'Temporary law root', level: 1, type: 'reference', lawReferenceCategoryCode: 'environment', parentId: null, category: { code: 'environment', name: 'Lingkungan' } })

    const wrongCategory = await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'k3', name: 'Wrong parent category', parentId: root.id }) })
    expect(wrongCategory.status).toBe(400)

    const childResponse = await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Temporary law child', parentId: root.id }) })
    expect(childResponse.status).toBe(201)
    const child = (await dataOf(childResponse)).data
    expect(child).toMatchObject({ level: 2, type: null, parent: { id: root.id, name: 'Temporary law root' }, category: { code: 'environment' } })

    expect((await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Child type', parentId: root.id, type: 'reference' }) })).status).toBe(400)
    const grandchildResponse = await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Temporary law grandchild', parentId: child.id }) })
    expect(grandchildResponse.status).toBe(201)
    const grandchild = (await dataOf(grandchildResponse)).data
    expect(grandchild).toMatchObject({ level: 3, parentId: child.id })
    expect((await app.request('/law-reference-items/create', { method: 'POST', headers, body: JSON.stringify({ lawReferenceCategoryCode: 'environment', name: 'Too deep', parentId: grandchild.id }) })).status).toBe(400)
    expect((await app.request(`/law-reference-items/update/${root.id}`, { method: 'PATCH', headers, body: JSON.stringify({ parentId: child.id }) })).status).toBe(400)

    const listResponse = await app.request('/law-reference-items/list?lawReferenceCategoryCode=environment&type=reference&level=1', { headers: { Cookie: fixture.cookie } })
    expect(listResponse.status).toBe(200)
    const list = await listResponse.json() as { data: Array<Record<string, any>> }
    expect(list.data.some((row) => row.id === root.id)).toBe(true)
    expect(list.data.every((row) => row.level === 1 && row.type === 'reference' && row.lawReferenceCategoryCode === 'environment')).toBe(true)

    const detailResponse = await app.request(`/law-reference-items/detail/${child.id}`, { headers: { Cookie: fixture.cookie } })
    expect(detailResponse.status).toBe(200)
    expect((await detailResponse.json() as { data: Record<string, any> }).data.parent.id).toBe(root.id)

    const treeResponse = await app.request('/law-reference-items/tree?lawReferenceCategoryCode=environment', { headers: { Cookie: fixture.cookie } })
    expect(treeResponse.status).toBe(200)
    expect((await treeResponse.json() as { data: { categories: Array<Record<string, any>>; items: Array<Record<string, any>> } }).data.categories.map((category) => category.code)).toEqual(['environment', 'k3', 'security'])

    expect((await app.request(`/law-reference-items/delete/${root.id}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })).status).toBe(200)
    expect((await app.request(`/law-reference-items/detail/${root.id}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
    expect((await app.request(`/law-reference-items/detail/${child.id}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)
    const afterDeleteTree = await app.request('/law-reference-items/tree?lawReferenceCategoryCode=environment', { headers: { Cookie: fixture.cookie } })
    const roots = (await afterDeleteTree.json() as { data: { items: Array<Record<string, any>> } }).data.items
    expect(roots.some((row) => row.id === root.id)).toBe(false)
  })
})

afterAll(() => closeDb())
