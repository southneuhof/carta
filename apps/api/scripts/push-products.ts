import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

async function main() {
  const db = getDb()

  await db.execute(sql.raw(`
    create table if not exists products (
      id text primary key,
      name text not null,
      sku text not null,
      created_at timestamp not null default now()
    )
  `))

  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
