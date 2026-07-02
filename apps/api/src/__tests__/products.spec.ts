import { sql } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../app'
import { closeDb, getDb } from '../db'
import { products } from '../domains/products/product.entity'

const productFixture = {
  id: 'product-1',
  name: 'Example Product',
  sku: 'EXAMPLE-1',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('products API', () => {
  beforeEach(async () => {
    const db = getDb()
    await db.execute(sql.raw('truncate table products'))
    await db.insert(products).values(productFixture)
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
