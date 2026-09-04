import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { bindDomainDatabase, defineDomainSchema } from '@southneuhof/sprindle/model'
import type { DomainPart } from '@southneuhof/sprindle/model'
import { modules } from './routes'

let pool: Pool | undefined
let db: ReturnType<typeof drizzle> | undefined
let domainSchema: ReturnType<typeof defineDomainSchema> | undefined
/** Runs registered test-session teardowns when the pool closes (test-only). */
let onPoolClose: (() => Promise<void>) | undefined

function domainParts(): readonly DomainPart[] {
  return modules.flatMap((module) => ('domain' in module && module.domain ? [module.domain] : []))
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')

  if (!db) {
    const schema = defineDomainSchema(domainParts())
    pool ??= new Pool({ connectionString })
    db = drizzle({ client: pool, relations: schema.relations as never })
    bindDomainDatabase(schema, db)
    domainSchema = schema
  }
  return db
}

export function getDomainSchema() {
  getDb()
  return domainSchema!
}

export type Db = ReturnType<typeof getDb>
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
export type DbOrTx = Db | Tx

/** Registers teardown work that must run before the pool closes (tests only). */
export function setPoolCloseHook(hook: () => Promise<void>) {
  onPoolClose = hook
}

export async function closeDb() {
  if (onPoolClose) {
    const hook = onPoolClose
    onPoolClose = undefined
    await hook()
  }
  await pool?.end()
  pool = undefined
  db = undefined
  domainSchema = undefined
}
