import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'

async function main() {
  const db = getDb()

  await db.execute(sql.raw('drop table if exists products'))
  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
