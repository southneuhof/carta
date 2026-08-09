import { eq, sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { createAuth } from '../src/routes/auth/auth'
import { employees } from '../src/routes/organization/organization.entity'
import { userRoles } from '../src/routes/roles/roles.entity'
import { users } from '../src/routes/users/users.entity'

/** Idempotent development seed: safe to run repeatedly against the same database. */
async function main() {
  const db = getDb()

  // Seeding expects a schema this script owns. The suites in src/__tests__ rebuild
  // the same tables with their own fixture ids under the same unique codes, so a
  // seed straight after `pnpm test` collides on the code rather than upserting by
  // id. Use `db:refresh` in that case — unpicking the fixture graph row by row
  // would just be a reset written less clearly.
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
      ('view-users', 'view-users', 'View users'), ('show-users', 'show-users', 'Show users'),
      ('update-users', 'update-users', 'Update users'),
      ('view-roles', 'view-roles', 'View roles'), ('show-roles', 'show-roles', 'Show roles'),
      ('create-roles', 'create-roles', 'Create roles'), ('update-roles', 'update-roles', 'Update roles'),
      ('delete-roles', 'delete-roles', 'Delete roles'),
      ('view-overtimes', 'view-overtimes', 'View overtime'), ('show-overtimes', 'show-overtimes', 'Show overtime'),
      ('create-overtimes', 'create-overtimes', 'Create overtime'), ('update-overtimes', 'update-overtimes', 'Update overtime'),
      ('view-notifications', 'view-notifications', 'View notifications'), ('show-notifications', 'show-notifications', 'Show notifications')
    on conflict (id) do update set code = excluded.code, name = excluded.name;

    insert into role_permissions (role_id, permission_id)
    select 'admin-role', id from permissions
    on conflict (role_id, permission_id) do update set active = true;

    insert into role_permissions (role_id, permission_id)
    select 'section-officer-role', id from permissions where code in ('view-users', 'show-users')
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

  // Seeded before the employee so the employee can point at it. The coordinator is
  // filled in afterwards, because the two tables reference each other.
  await db.execute(sql.raw(`
    insert into section_groups (id, name, section_id) values ('group-north', 'Regu Utara', 'section-north')
    on conflict (id) do update set name = excluded.name, section_id = excluded.section_id;
  `))

  await db.insert(employees).values({
    id: 'employee-admin',
    fullName: 'Demo Administrator',
    userId: adminId,
    sectionId: 'section-north',
    // Supervisor, not manager: the chain's first step targets `position-supervisor`,
    // and with nobody holding it in this section that notification would fan out to
    // nobody. One seeded login has to satisfy every step for the flow to be
    // walkable in development.
    jobPositionId: 'position-supervisor',
    sectionGroupId: 'group-north',
  }).onConflictDoUpdate({
    target: employees.id,
    set: { userId: adminId, sectionId: 'section-north', jobPositionId: 'position-supervisor', sectionGroupId: 'group-north' },
  })

  // The chain's second step is `sectionGroupHead`, so without a coordinator the
  // seeded admin cannot submit anything and the development data is unusable —
  // `seedChain` refuses at submit rather than stranding the record. The admin is
  // its own coordinator here because it is the only seeded login; that is
  // development convenience, not a model of the real org chart.
  await db.execute(sql.raw(`update section_groups set koreg_employee_id = 'employee-admin' where id = 'group-north'`))

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

  // The overtime verification chain: supervisor first, then the shift coordinator.
  // `orderNumber` starts at 1 — there is no "not yet seeded" sentinel step.
  await db.execute(sql.raw(`
    insert into config_verificators (id, module_name, section_type_id, order_number, verificator_type, job_position_id) values
      ('chain-overtime-1', 'overtimes', 'section-type-toll', 1, 'jobPosition', 'position-supervisor'),
      ('chain-overtime-2', 'overtimes', 'section-type-toll', 2, 'sectionGroupHead', null)
    on conflict (id) do update set
      module_name = excluded.module_name, section_type_id = excluded.section_type_id,
      order_number = excluded.order_number, verificator_type = excluded.verificator_type,
      job_position_id = excluded.job_position_id;

    insert into notifications (id, recipient_employee_id, job_position_id, role_id, section_id, title, content, status_code, notification_type, module_name) values
      ('notif-direct', 'employee-admin', null, null, 'section-north', 'Lembur menunggu verifikasi', 'Satu pengajuan lembur menunggu tindakan Anda.', 'unseen', 'verification', 'overtimes'),
      ('notif-position', null, 'position-supervisor', null, 'section-north', 'Rekap mingguan tersedia', 'Rekap lembur minggu ini sudah dapat dilihat.', 'unseen', 'info', 'overtimes'),
      ('notif-role', null, null, 'admin-role', 'section-north', 'Konfigurasi diperbarui', 'Rantai verifikasi lembur telah diperbarui.', 'seen', 'info', 'settings')
    on conflict (id) do update set
      title = excluded.title, content = excluded.content, status_code = excluded.status_code;

    insert into overtimes (id, section_id, applicant_employee_id, date, start_time, estimated_minutes, description, status_code, created_by_user_id) values
      ('overtime-draft', 'section-north', 'employee-admin', '2026-07-20', '18:00', 120, 'Perbaikan gardu tol', 'draft', '${adminId}'),
      ('overtime-waiting', 'section-north', 'employee-admin', '2026-07-21', '19:00', 180, 'Penanganan insiden lalu lintas', 'waiting', '${adminId}')
    on conflict (id) do update set
      description = excluded.description, status_code = excluded.status_code;

    insert into log_verifications (id, module_name, module_id, order_number, verificator_type, job_position_id, recipient_employee_id, status_code) values
      ('log-overtime-waiting-1', 'overtimes', 'overtime-waiting', 1, 'jobPosition', 'position-supervisor', null, 'waiting'),
      ('log-overtime-waiting-2', 'overtimes', 'overtime-waiting', 2, 'sectionGroupHead', null, 'employee-admin', 'pending')
    on conflict (id) do update set status_code = excluded.status_code;
  `))

  await closeDb()
}

main().catch(async (error: unknown) => {
  await closeDb()
  throw error
})
