import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { createAuth } from '../src/routes/auth/auth'

/** Idempotent development seed: safe to run repeatedly against the same database. */
async function main() {
  const db = getDb()

  await db.execute(sql.raw(`
    insert into roles (id, name)
    values ('admin-role', 'Administrator')
    on conflict (id) do nothing;

    insert into permissions (id, name) values
      ('view-user', 'View users'), ('show-user', 'Show user'), ('create-user', 'Create user'), ('update-user', 'Update user'), ('delete-user', 'Delete user'),
      ('view-role', 'View roles'), ('show-role', 'Show role'), ('create-role', 'Create role'), ('update-role', 'Update role'), ('delete-role', 'Delete role')
    on conflict (id) do update set name = excluded.name;

    insert into role_permissions (role_id, permission_id)
    select 'admin-role', id from permissions
    on conflict do nothing;
  `))

  const existingCredential = await db.execute(sql.raw(`
    select accounts.id from accounts
    join users on users.id = accounts.user_id
    where users.email = 'admin@example.com' and accounts.provider_id = 'credential'
    limit 1
  `))

  if (existingCredential.rows.length === 0) {
    await db.execute(sql.raw(`delete from users where email = 'admin@example.com'`))
    await createAuth({ allowSignUp: true }).api.signUpEmail({
      body: {
        name: 'Demo Administrator',
        email: 'admin@example.com',
        password: 'demo-password',
        roleId: 'admin-role',
      },
    })
  }

  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
