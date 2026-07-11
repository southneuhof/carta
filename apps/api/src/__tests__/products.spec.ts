import { and, eq, sql } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../app'
import { closeDb, getDb } from '../db'
import { productVariants } from '../routes/product-variants/product-variants.entity'
import { productVariantAssignments, products } from '../routes/products/products.entity'
import { permissions, rolePermissions, roles } from '../routes/roles/roles.entity'
import { users } from '../routes/users/users.entity'

const roleFixture = { id: 'role-admin', name: 'Administrator', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const permissionFixtures = [
  ['view-user', 'View users'], ['show-user', 'Show user'], ['create-user', 'Create user'], ['update-user', 'Update user'], ['delete-user', 'Delete user'],
  ['view-role', 'View roles'], ['show-role', 'Show role'], ['create-role', 'Create role'], ['update-role', 'Update role'], ['delete-role', 'Delete role'],
].map(([id, name]) => ({ id: id!, name: name! }))

const userFixture = {
  id: 'user-1',
  name: 'Product Owner',
  email: 'admin@example.com',
  roleId: 'role-admin',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const secondUserFixture = {
  id: 'user-2',
  name: 'Second Owner',
  email: 'second@example.com',
  roleId: 'role-admin',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const productFixture = {
  id: 'product-1',
  name: 'Example Product',
  sku: 'EXAMPLE-1',
  ownerId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('products API', () => {
  beforeEach(async () => {
    const db = getDb()
    await db.execute(sql.raw(`
      drop table if exists product_variant_assignments;
      drop table if exists product_variants;
      drop table if exists products;
      drop table if exists users;
      drop table if exists role_permissions;
      drop table if exists permissions;
      drop table if exists roles;

      create table if not exists roles (
        id text primary key,
        name text not null,
        created_at timestamp not null default now(),
        updated_at timestamp not null default now()
      );

      create table if not exists permissions (
        id text primary key,
        name text not null
      );

      create table if not exists role_permissions (
        role_id text not null references roles(id) on delete cascade,
        permission_id text not null references permissions(id) on delete cascade,
        primary key (role_id, permission_id)
      );

      create table if not exists users (
        id text primary key,
        name text not null,
        email text not null unique,
        role_id text not null references roles(id),
        created_at timestamp not null default now(),
        updated_at timestamp not null default now()
      );

      create table if not exists products (
        id text primary key,
        name text not null,
        sku text not null,
        owner_id text references users(id),
        created_at timestamp not null default now()
      );

      create table if not exists product_variants (
        id text primary key,
        name text not null,
        created_at timestamp not null default now()
      );

      create table if not exists product_variant_assignments (
        product_id text not null references products(id),
        variant_id text not null references product_variants(id),
        primary key (product_id, variant_id)
      );
    `))
    await db.insert(roles).values(roleFixture)
    await db.insert(permissions).values(permissionFixtures)
    await db.insert(rolePermissions).values(permissionFixtures.map(({ id }) => ({ roleId: roleFixture.id, permissionId: id })))
    await db.insert(users).values([userFixture, secondUserFixture])
    await db.insert(products).values(productFixture)
    await db.insert(productVariants).values([
      { id: 'body', name: 'Body', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'hand', name: 'Hand', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'soap', name: 'Soap', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'brand-a', name: 'Brand A', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'brand-b', name: 'Brand B', createdAt: '2026-01-01T00:00:00.000Z' },
    ])
    await db.insert(productVariantAssignments).values([
      { productId: 'product-1', variantId: 'body' },
      { productId: 'product-1', variantId: 'soap' },
      { productId: 'product-1', variantId: 'brand-a' },
    ])
  })

  afterAll(() => closeDb())

  it('serves product framework routes', async () => {
    const health = await app.request('/health')
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ ok: true })

    const list = await app.request('/products/list')
    expect(list.status).toBe(200)
    expect(await list.json()).toMatchObject({ page: 1, limit: 20 })

    const detail = await app.request('/products/detail/product-1')
    expect(detail.status).toBe(200)
    expect(await detail.json()).toMatchObject({ data: { id: 'product-1' } })

    const created = await app.request('/products/create', {
      method: 'POST',
      body: JSON.stringify({ id: 'product-2', name: 'Second', sku: 'SECOND-2' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(created.status).toBe(201)

    const updated = await app.request('/products/update/product-2', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(updated.status).toBe(200)
    expect(await updated.json()).toMatchObject({ data: { name: 'Updated' } })

    const deleted = await app.request('/products/delete/product-2', { method: 'DELETE' })
    expect(deleted.status).toBe(200)
    expect(await deleted.json()).toEqual({ ok: true })
  })

  it('runs declarative product authorization and validation hooks', async () => {
    const denied = await app.request('/products/list', { headers: { 'x-product-access': 'denied' } })
    expect(denied.status).toBe(403)
    expect(await denied.json()).toEqual({ error: 'forbidden', issues: [{ message: 'Product access denied.' }] })

    const invalid = await app.request('/products/create', {
      method: 'POST',
      body: JSON.stringify({ id: 'product-reserved', name: 'Reserved', sku: 'RESERVED' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toEqual({ error: 'validation_error', issues: [{ field: 'sku', message: 'SKU is reserved.' }] })
  })

  it('returns relation-aware product reads', async () => {
    const detail = await app.request('/products/detail/product-1')
    expect(detail.status).toBe(200)
    expect(await detail.json()).toMatchObject({
      data: {
        id: 'product-1',
        author: { id: 'user-1', name: 'Product Owner' },
        variants: [{ id: 'body' }, { id: 'soap' }, { id: 'brand-a' }],
      },
    })

    const list = await app.request('/products/list')
    expect(list.status).toBe(200)
    expect(await list.json()).toMatchObject({
      data: [
        {
          id: 'product-1',
          author: { id: 'user-1' },
          variants: [{ id: 'body' }, { id: 'soap' }, { id: 'brand-a' }],
        },
      ],
    })
  })

  it('writes relation fields on create and update', async () => {
    const created = await app.request('/products/create', {
      method: 'POST',
      body: JSON.stringify({
        id: 'product-2',
        name: 'Second',
        sku: 'SECOND-2',
        author: { id: 'user-2' },
        variants: [{ id: 'hand' }, { id: 'soap' }, { id: 'brand-b' }, { id: 'soap' }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(created.status).toBe(201)
    expect(await created.json()).toMatchObject({
      data: {
        id: 'product-2',
        author: { id: 'user-2', name: 'Second Owner' },
        variants: [{ id: 'hand' }, { id: 'soap' }, { id: 'brand-b' }],
      },
    })

    const updateWithoutVariants = await app.request('/products/update/product-2', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Second Updated', author: { id: 'user-1' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(updateWithoutVariants.status).toBe(200)
    expect(await updateWithoutVariants.json()).toMatchObject({
      data: {
        name: 'Second Updated',
        author: { id: 'user-1' },
        variants: [{ id: 'hand' }, { id: 'soap' }, { id: 'brand-b' }],
      },
    })

    const lowLevelRows = await getDb().select().from(productVariantAssignments)
    expect(lowLevelRows).toEqual(
      expect.arrayContaining([
        { productId: 'product-1', variantId: 'soap' },
        { productId: 'product-2', variantId: 'soap' },
      ]),
    )

    const replaceVariants = await app.request('/products/update/product-2', {
      method: 'PATCH',
      body: JSON.stringify({ variants: [{ id: 'soap' }] }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(replaceVariants.status).toBe(200)
    expect(await replaceVariants.json()).toMatchObject({ data: { variants: [{ id: 'soap', name: 'Soap' }] } })

    const clearVariants = await app.request('/products/update/product-2', {
      method: 'PATCH',
      body: JSON.stringify({ variants: [] }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(clearVariants.status).toBe(200)
    expect(await clearVariants.json()).toMatchObject({ data: { variants: [] } })
  })

  it('serves nested and custom routes', async () => {
    const version = await app.request('/products/gamer/version1')
    expect(version.status).toBe(200)
    expect(await version.json()).toEqual({ version: 1 })

    const versionTest = await app.request('/products/gamer/test/versionTest')
    expect(versionTest.status).toBe(200)
    expect(await versionTest.json()).toEqual({ ok: true, version: 'test' })

    const custom = await app.request('/products/customProductRoute', { method: 'POST' })
    expect(custom.status).toBe(200)
    expect(await custom.json()).toEqual({ ok: true, route: 'products' })

    const customMaterialize = await app.request('/products/customProductMaterialize')
    expect(customMaterialize.status).toBe(200)
    expect(await customMaterialize.json()).toMatchObject({
      data: [
        {
          id: 'product-1',
          variants: [{ id: 'body' }, { id: 'soap' }, { id: 'brand-a' }],
        },
      ],
    })
  })

  it('returns not_found for missing detail and update records', async () => {
    const detail = await app.request('/products/detail/missing-product')
    expect(detail.status).toBe(404)
    expect(await detail.json()).toEqual({ error: 'not_found' })

    const update = await app.request('/products/update/missing-product', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Missing' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(update.status).toBe(404)
    expect(await update.json()).toEqual({ error: 'not_found' })
  })

  it('supports mock login plus Users and Roles CRUD', async () => {
    const rejectedLogin = await app.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin@example.com', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(rejectedLogin.status).toBe(401)

    const login = await app.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin@example.com', password: 'demo-password' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(login.status).toBe(200)
    expect(await login.json()).toMatchObject({ token: 'demo-token', user: { email: 'admin@example.com', role_id: 1 }, tasks: expect.arrayContaining(['view-user', 'delete-role']) })

    const createdRole = await app.request('/roles/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'Editor' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(createdRole.status).toBe(201)
    const roleData = (await createdRole.json()).data
    expect(roleData).toMatchObject({ name: 'Editor' })

    const createdUser = await app.request('/users/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'Editor User', email: 'editor@example.com', roleId: roleData.id }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(createdUser.status).toBe(201)
    const userData = (await createdUser.json()).data
    expect(userData).toMatchObject({ email: 'editor@example.com', role: { id: roleData.id, name: 'Editor' } })

    const listedUsers = await app.request('/users/list')
    expect((await listedUsers.json()).data).toEqual(expect.arrayContaining([expect.objectContaining({ id: userData.id, role: expect.objectContaining({ name: 'Editor' }) })]))

    const updatedUser = await app.request(`/users/update/${userData.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Editor' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(updatedUser.status).toBe(200)
    expect(await updatedUser.json()).toMatchObject({ data: { name: 'Updated Editor' } })

    const blockedRoleDelete = await app.request(`/roles/delete/${roleData.id}`, { method: 'DELETE' })
    expect(blockedRoleDelete.status).toBe(409)
    expect(await blockedRoleDelete.json()).toEqual({ error: 'role_in_use', message: 'Role masih dipakai oleh pengguna.' })

    const deletedUser = await app.request(`/users/delete/${userData.id}`, { method: 'DELETE' })
    expect(deletedUser.status).toBe(200)
    const deletedRole = await app.request(`/roles/delete/${roleData.id}`, { method: 'DELETE' })
    expect(deletedRole.status).toBe(200)
  })

  it('lists and idempotently toggles persisted role permissions', async () => {
    const adminList = await app.request('/roles/role-admin/permissions')
    expect(adminList.status).toBe(200)
    expect(await adminList.json()).toMatchObject({ total: 10, data: expect.arrayContaining([expect.objectContaining({ id: 'view-user', assigned: true })]) })

    await getDb().insert(roles).values({ id: 'role-editor', name: 'Editor' })
    const editorList = await app.request('/roles/role-editor/permissions')
    expect(await editorList.json()).toMatchObject({ total: 10, data: expect.arrayContaining([expect.objectContaining({ id: 'view-user', assigned: false })]) })

    for (let attempt = 0; attempt < 2; attempt++) {
      const assigned = await app.request('/roles/role-editor/permissions/view-user', { method: 'PUT' })
      expect(assigned.status).toBe(200)
      expect(await assigned.json()).toEqual({ data: { id: 'view-user', name: 'View users', assigned: true } })
    }
    const assignments = await getDb().select().from(rolePermissions).where(and(eq(rolePermissions.roleId, 'role-editor'), eq(rolePermissions.permissionId, 'view-user')))
    expect(assignments).toHaveLength(1)

    for (let attempt = 0; attempt < 2; attempt++) {
      const revoked = await app.request('/roles/role-editor/permissions/view-user', { method: 'DELETE' })
      expect(revoked.status).toBe(200)
      expect(await revoked.json()).toEqual({ data: { id: 'view-user', name: 'View users', assigned: false } })
    }

    expect((await app.request('/roles/missing/permissions')).status).toBe(404)
    expect((await app.request('/roles/role-editor/permissions/missing', { method: 'PUT' })).status).toBe(404)

    await app.request('/roles/role-editor/permissions/view-user', { method: 'PUT' })
    expect((await app.request('/roles/delete/role-editor', { method: 'DELETE' })).status).toBe(200)
    expect(await getDb().select().from(rolePermissions).where(eq(rolePermissions.roleId, 'role-editor'))).toHaveLength(0)
  })
})
