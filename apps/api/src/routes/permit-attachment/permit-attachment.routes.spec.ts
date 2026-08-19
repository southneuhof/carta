import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { eq, inArray, or } from 'drizzle-orm'
import { app } from '../../app'
import { closeDb, getDb } from '../../db'
import { accounts, sessions } from '../auth/auth.entity'
import { getAuth } from '../auth/auth'
import { authorizationModules, permissions, rolePermissions, roles, systemRoleAssignments } from '../roles/roles.entity'
import { users } from '../users/users.entity'
import { permitWorkTypes } from '../permit-work-types/permit-work-types.entity'
import { permitAttachments } from './permit-attachment.entity'

const crudPermissions = [
  'list-permit-attachment',
  'detail-permit-attachment',
  'create-permit-attachment',
  'update-permit-attachment',
  'delete-permit-attachment',
] as const

function id(prefix: string) {
  return `permit-attachment-test-${prefix}-${crypto.randomUUID()}`
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

  await db.insert(users).values({ id: userId, name: 'Permit Attachment Test User', email })
  await db.insert(accounts).values({
    id: id('account'),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: await hashPassword('test-password'),
  })
  await db.insert(authorizationModules).values({ id: moduleId, code: id('module-code'), name: 'Permit Attachment Test', realm: 'system' })
  await db.insert(roles).values({ id: roleId, roleCode: id('role-code'), name: 'Permit Attachment Test Role', realm: 'system' })

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

describe('permit attachment routes', () => {
  afterEach(async () => {
    const db = getDb()
    while (fixtures.length) {
      const fixture = fixtures.pop()!
      await db.delete(permitAttachments).where(or(
        eq(permitAttachments.createdByUserId, fixture.userId),
        eq(permitAttachments.updatedByUserId, fixture.userId),
      ))
      await db.delete(permitWorkTypes).where(or(
        eq(permitWorkTypes.createdByUserId, fixture.userId),
        eq(permitWorkTypes.updatedByUserId, fixture.userId),
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
    expect((await app.request('/permit-attachment/list')).status).toBe(401)

    const limited = await makeSession([])
    expect((await app.request('/permit-attachment/list', { headers: { Cookie: limited.cookie } })).status).toBe(403)
    expect((await app.request('/permit-attachment/create', {
      method: 'POST',
      headers: jsonHeaders(limited.cookie),
      body: JSON.stringify({ name: 'Denied' }),
    })).status).toBe(403)
  })

  it('supports validated audited CRUD and relation validation', async () => {
    const fixture = await makeSession([...crudPermissions, 'delete-permit-work-types'])
    const headers = jsonHeaders(fixture.cookie)
    const workTypeId = id('work-type')
    await getDb().insert(permitWorkTypes).values({ id: workTypeId, name: 'Attachment Test Work Type', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })

    const invalidName = await app.request('/permit-attachment/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '   ' }),
    })
    expect(invalidName.status).toBe(400)

    const invalidRelation = await app.request('/permit-attachment/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Invalid Relation', permitWorkTypeId: id('missing-work-type') }),
    })
    expect(invalidRelation.status).toBe(400)

    const invalidActive = await app.request('/permit-attachment/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Invalid Active', active: 'yes' }),
    })
    expect(invalidActive.status).toBe(400)

    const createdResponse = await app.request('/permit-attachment/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '  Checklist Copy  ', description: 'Description', code: '  PA-COPY  ', permitWorkTypeId: workTypeId }),
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json() as { data: Record<string, unknown> }).data
    expect(created).toMatchObject({
      name: 'Checklist Copy',
      code: 'PA-COPY',
      description: 'Description',
      active: true,
      permitWorkTypeId: workTypeId,
      createdByUserId: fixture.userId,
      updatedByUserId: fixture.userId,
    })
    expect(created.createdAt).toEqual(expect.any(String))
    expect(created.updatedAt).toEqual(expect.any(String))

    const blankCodeResponse = await app.request('/permit-attachment/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'No Code', code: '  ' }),
    })
    expect(blankCodeResponse.status).toBe(201)
    expect((await blankCodeResponse.json() as { data: { code: string | null } }).data.code).toBeNull()

    const duplicateCode = await app.request('/permit-attachment/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Duplicate Code', code: 'PA-COPY' }),
    })
    expect(duplicateCode.status).toBe(400)

    const listResponse = await app.request('/permit-attachment/list?page=1&limit=20', { headers: { Cookie: fixture.cookie } })
    expect(listResponse.status).toBe(200)
    const listed = await listResponse.json() as { data: Array<Record<string, unknown>> }
    expect(listed.data.some((row) => row.id === created.id && row.name === 'Checklist Copy')).toBe(true)

    const detailResponse = await app.request(`/permit-attachment/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })
    expect(detailResponse.status).toBe(200)
    expect((await detailResponse.json() as { data: Record<string, unknown> }).data).toMatchObject({ id: created.id, name: 'Checklist Copy', permitWorkTypeId: workTypeId })

    const updateResponse = await app.request(`/permit-attachment/update/${String(created.id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: '  Updated Checklist ', description: null, active: false, code: ' UPDATED ' }),
    })
    expect(updateResponse.status).toBe(200)
    const updated = (await updateResponse.json() as { data: Record<string, unknown> }).data
    expect(updated).toMatchObject({
      name: 'Updated Checklist',
      description: null,
      active: false,
      code: 'UPDATED',
      permitWorkTypeId: workTypeId,
      updatedByUserId: fixture.userId,
    })

    const deleteResponse = await app.request(`/permit-attachment/delete/${String(created.id)}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(deleteResponse.status).toBe(200)
    expect((await app.request(`/permit-attachment/detail/${String(created.id)}`, { headers: { Cookie: fixture.cookie } })).status).toBe(404)

    const cascadeWorkTypeId = id('cascade-work-type')
    const cascadeAttachmentId = id('cascade-attachment')
    await getDb().insert(permitWorkTypes).values({ id: cascadeWorkTypeId, name: 'Cascade Work Type', active: true, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    await getDb().insert(permitAttachments).values({ id: cascadeAttachmentId, name: 'Cascade Attachment', active: true, permitWorkTypeId: cascadeWorkTypeId, createdByUserId: fixture.userId, updatedByUserId: fixture.userId })
    const cascadeDeleteResponse = await app.request(`/permit-work-types/delete/${cascadeWorkTypeId}`, { method: 'DELETE', headers: { Cookie: fixture.cookie } })
    expect(cascadeDeleteResponse.status).toBe(200)
    expect((await getDb().select({ id: permitAttachments.id }).from(permitAttachments).where(inArray(permitAttachments.id, [cascadeAttachmentId])))).toHaveLength(0)
  }, 20_000)
})

afterAll(() => closeDb())
