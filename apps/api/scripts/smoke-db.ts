import { app as rawApp } from '../src/app'
import { closeDb } from '../src/db'
import { getAuth } from '../src/routes/auth/auth'

async function main() {
  // Product routes require a session (see the authenticated() guards); sign in as the seeded admin.
  const signedIn = await getAuth().api.signInEmail({
    body: { email: 'admin@example.com', password: 'demo-password' },
    returnHeaders: true,
  })
  const cookie = signedIn.headers.get('set-cookie')?.split(';')[0]
  if (!cookie) throw new Error('Smoke sign-in failed: run `pnpm run db:seed` first.')

  const app = {
    request(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers)
      headers.set('Cookie', cookie)
      return rawApp.request(path, { ...init, headers })
    },
  }

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
