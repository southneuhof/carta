import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

async function main() {
  const db = getDb()

  await db.execute(sql.raw(`
    drop table if exists product_variant_assignments;
    drop table if exists product_variants;
    drop table if exists products;
    drop table if exists users;
  `))
  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
