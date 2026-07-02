import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { bindDomainDatabase } from '@southneuhof/domain/model'
import { domainSchema } from './domain-schema'

let pool: Pool | undefined
let db: ReturnType<typeof drizzle> | undefined

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')

  pool ??= new Pool({ connectionString })
  db ??= drizzle({ client: pool, relations: domainSchema.relations as never })
  bindDomainDatabase(domainSchema, db)
  return db
}

export async function closeDb() {
  await pool?.end()
  pool = undefined
  db = undefined
}
