import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { bindDomainDatabase, defineDomainSchema } from '@southneuhof/sprindle/model'
import { domainParts } from './routes'

let pool: Pool | undefined
let db: ReturnType<typeof drizzle> | undefined
let domainSchema: ReturnType<typeof defineDomainSchema> | undefined

function getDomainSchema() {
  return (domainSchema ??= defineDomainSchema(domainParts))
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')

  const schema = getDomainSchema()
  pool ??= new Pool({ connectionString })
  db ??= drizzle({ client: pool, relations: schema.relations as never })
  bindDomainDatabase(schema, db)
  return db
}

export async function closeDb() {
  await pool?.end()
  pool = undefined
  db = undefined
}
