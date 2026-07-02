import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

let pool: Pool | undefined
let db: ReturnType<typeof drizzle> | undefined

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')

  pool ??= new Pool({ connectionString })
  db ??= drizzle(pool)
  return db
}

export async function closeDb() {
  await pool?.end()
  pool = undefined
  db = undefined
}
