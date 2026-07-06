import { sql } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../app'
import { closeDb, getDb } from '../db'
import { productVariants } from '../domains/product-variants/product-variant.entity'
import { productVariantAssignments, products } from '../domains/products/product.entity'
import { users } from '../domains/users/user.entity'

const userFixture = {
  id: 'user-1',
  name: 'Product Owner',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const secondUserFixture = {
  id: 'user-2',
  name: 'Second Owner',
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

      create table if not exists users (
        id text primary key,
        name text not null,
        created_at timestamp not null default now()
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

  it('serves nested and custom actions', async () => {
    const version = await app.request('/products/nested/version1')
    expect(version.status).toBe(200)
    expect(await version.json()).toEqual({ version: 1 })

    const versionTest = await app.request('/products/nested/test/versionTest')
    expect(versionTest.status).toBe(200)
    expect(await versionTest.json()).toEqual({ ok: true, version: 'test' })

    const custom = await app.request('/products/customProductAction', { method: 'POST' })
    expect(custom.status).toBe(200)
    expect(await custom.json()).toEqual({ ok: true, action: 'products' })

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
})
