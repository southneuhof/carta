import { eq, sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { createAuth } from '../src/routes/auth/auth'
import { employees } from '../src/routes/organization/organization.entity'
import { userRoles } from '../src/routes/roles/roles.entity'
import { users } from '../src/routes/users/users.entity'

/** Idempotent development seed: safe to run repeatedly against the same database. */
async function main() {
  const db = getDb()

  await db.execute(sql.raw(`
    insert into section_types (id, code, name)
    values ('section-type-toll', 'TOLL', 'Ruas Tol')
    on conflict (id) do update set code = excluded.code, name = excluded.name;

    insert into toll_sections (id, code, name, section_type_id) values
      ('section-north', 'NORTH', 'Ruas Utara', 'section-type-toll'),
      ('section-south', 'SOUTH', 'Ruas Selatan', 'section-type-toll')
    on conflict (id) do update set code = excluded.code, name = excluded.name, section_type_id = excluded.section_type_id;

    insert into job_positions (id, code, name) values
      ('position-officer', 'OFFICER', 'Petugas'),
      ('position-supervisor', 'SUPERVISOR', 'Supervisor'),
      ('position-manager', 'MANAGER', 'Manager')
    on conflict (id) do update set code = excluded.code, name = excluded.name;

    insert into roles (id, name, scope) values
      ('admin-role', 'Administrator', 'all'),
      ('section-officer-role', 'Petugas Ruas', 'section')
    on conflict (id) do update set name = excluded.name, scope = excluded.scope;

    insert into permissions (id, code, name) values
      ('view-user', 'view-user', 'View users'), ('show-user', 'show-user', 'Show user'),
      ('create-user', 'create-user', 'Create user'), ('update-user', 'update-user', 'Update user'),
      ('delete-user', 'delete-user', 'Delete user'),
      ('view-role', 'view-role', 'View roles'), ('show-role', 'show-role', 'Show role'),
      ('create-role', 'create-role', 'Create role'), ('update-role', 'update-role', 'Update role'),
      ('delete-role', 'delete-role', 'Delete role')
    on conflict (id) do update set code = excluded.code, name = excluded.name;

    insert into role_permissions (role_id, permission_id)
    select 'admin-role', id from permissions
    on conflict (role_id, permission_id) do update set active = true;

    insert into role_permissions (role_id, permission_id)
    select 'section-officer-role', id from permissions where code in ('view-user', 'show-user')
    on conflict (role_id, permission_id) do update set active = true;
  `))

  const existingCredential = await db.execute(sql.raw(`
    select accounts.id from accounts
    join users on users.id = accounts.user_id
    where users.email = 'admin@example.com' and accounts.provider_id = 'credential'
    limit 1
  `))

  if (existingCredential.rows.length === 0) {
    await db.execute(sql.raw(`delete from employees where user_id in (select id from users where email = 'admin@example.com')`))
    await db.execute(sql.raw(`delete from users where email = 'admin@example.com'`))
    await createAuth({ allowSignUp: true }).api.signUpEmail({
      body: { name: 'Demo Administrator', email: 'admin@example.com', password: 'demo-password' },
    })
  }

  // Sign-up no longer carries a role; identity is assembled here from its own tables.
  const admin = await db.select({ id: users.id }).from(users).where(eq(users.email, 'admin@example.com')).limit(1)
  const adminId = admin[0]?.id
  if (!adminId) throw new Error('Seed could not resolve the admin user.')

  await db.insert(userRoles).values({ userId: adminId, roleId: 'admin-role' })
    .onConflictDoUpdate({ target: [userRoles.userId, userRoles.roleId], set: { active: true } })

  await db.insert(employees).values({
    id: 'employee-admin',
    fullName: 'Demo Administrator',
    userId: adminId,
    sectionId: 'section-north',
    jobPositionId: 'position-manager',
  }).onConflictDoUpdate({
    target: employees.id,
    set: { userId: adminId, sectionId: 'section-north', jobPositionId: 'position-manager' },
  })

  // A person without a login: the org chart holds people who never sign in, and
  // recipient resolution has to keep working for them.
  await db.insert(employees).values({
    id: 'employee-unlinked',
    fullName: 'Petugas Tanpa Akun',
    sectionId: 'section-south',
    jobPositionId: 'position-officer',
  }).onConflictDoUpdate({
    target: employees.id,
    set: { sectionId: 'section-south', jobPositionId: 'position-officer' },
  })

  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
