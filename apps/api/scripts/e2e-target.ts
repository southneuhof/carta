import { sql } from 'drizzle-orm'
import { getDb } from '../src/db'

export const E2E_DATABASE_NAME = process.env.CARTA_E2E_DATABASE_NAME ?? 'carta_e2e'
export const E2E_BUCKET_NAME = 'carta-e2e'
export const E2E_DATABASE_PURPOSE = 'e2e'

function expectedE2eDatabaseName() {
  return process.env.CARTA_E2E_DATABASE_NAME ?? E2E_DATABASE_NAME
}

type E2eTarget = {
  databaseName: string | undefined
  bucket: string | undefined
  purpose: string | undefined
}

export function assertE2eStorageTarget(bucket: string | undefined = process.env.S3_BUCKET): asserts bucket is string {
  if (bucket !== E2E_BUCKET_NAME) throw new Error('E2E storage guard refused the configured bucket.')
}

export function assertE2eTarget(target: E2eTarget) {
  if (target.purpose !== E2E_DATABASE_PURPOSE) throw new Error('E2E database guard requires CARTA_DATABASE_PURPOSE=e2e.')
  if (target.databaseName !== expectedE2eDatabaseName()) throw new Error('E2E database guard refused the connected database.')
  assertE2eStorageTarget(target.bucket)
}

export async function connectedDatabaseName() {
  const result = await getDb().execute(sql`select current_database() as database_name`)
  const databaseName = (result.rows[0] as { database_name?: unknown } | undefined)?.database_name
  if (typeof databaseName !== 'string' || !databaseName) throw new Error('Could not read the connected database name.')
  return databaseName
}

export async function assertConnectedE2eTarget() {
  assertE2eTarget({
    databaseName: await connectedDatabaseName(),
    bucket: process.env.S3_BUCKET,
    purpose: process.env.CARTA_DATABASE_PURPOSE,
  })
}
