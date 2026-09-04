import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { can, resolveIdentity } from '../src/authorization'

const seedEmail = process.env.CARTA_ADMIN_EMAIL ?? process.env.ADS_HK_ADMIN_EMAIL ?? 'admin@example.com'

async function main() {
  try {
    const db = getDb()
    const result = await db.execute(sql`
      select
        (select count(*) from permissions) as permission_count,
        (select count(*) from roles where role_code = 'administrator') as admin_role_count,
        (select id from users where email = ${seedEmail} limit 1) as admin_id,
        (select count(*) from role_assignments where user_id = (select id from users where email = ${seedEmail} limit 1)) as assignment_count
    `)
    const row = result.rows[0] as {
      permission_count: string
      admin_role_count: string
      admin_id: string | null
      assignment_count: string
    }
    if (!row || Number(row.permission_count) < 1 || row.admin_role_count !== '1' || !row.admin_id || Number(row.assignment_count) < 1) {
      throw new Error('Database smoke check failed: seed records are missing.')
    }
    const identity = await resolveIdentity(row.admin_id)
    if (!identity?.permissions.has('list-roles')) {
      throw new Error('Database smoke check failed: system permission resolution is missing.')
    }
    if (!(await can(row.admin_id, 'create-users'))) {
      throw new Error('Database smoke check failed: seeded admin is missing create-users.')
    }
  } finally {
    await closeDb()
  }
}

main().catch((error: unknown) => {
  throw error
})
