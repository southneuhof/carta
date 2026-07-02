import { app } from '../src/app'
import { closeDb } from '../src/db'

async function main() {
  const id = 'product-smoke'
  await app.request(`/products/delete/${id}`, { method: 'DELETE' })

  const created = await app.request('/products/create', {
    method: 'POST',
    body: JSON.stringify({ id, name: 'Smoke Product', sku: 'SMOKE-1' }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (created.status !== 201) throw new Error(`POST /products/create failed: ${created.status}`)

  const updated = await app.request(`/products/update/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Smoke Product Updated' }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!updated.ok) throw new Error(`PATCH /products/update/:id failed: ${updated.status}`)

  const deleted = await app.request(`/products/delete/${id}`, { method: 'DELETE' })
  if (!deleted.ok) throw new Error(`DELETE /products/delete/:id failed: ${deleted.status}`)

  await closeDb()
  console.log('DB smoke passed.')
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
