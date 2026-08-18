import { sql } from 'drizzle-orm'
import { closeDb, getDb } from '../src/db'
import { hasProjectPermission, resolveSystemIdentity } from '../src/authorization'

const seedEmail = process.env.ADS_HK_ADMIN_EMAIL ?? 'admin@example.com'

async function main() {
  try {
    const db = getDb()
    const result = await db.execute(sql`
      select
        (select count(*) from authorization_modules) as module_count,
        (select count(*) from permissions) as permission_count,
        (select count(*) from roles where role_code = 'super-administrator') as system_role_count,
        (select count(*) from roles where role_code = 'project-administrator') as project_role_count,
        (select id from users where email = ${seedEmail} limit 1) as admin_id,
        (select id from projects where id = 'project-default' limit 1) as project_id,
        (select count(*) from system_role_assignments where user_id = (select id from users where email = ${seedEmail} limit 1)) as system_assignment_count,
        (select count(*) from project_role_assignments where user_id = (select id from users where email = ${seedEmail} limit 1)) as project_assignment_count,
        (select count(*) from inspection_test_plans where work_item_id = 'work-item-default' and active = true) as active_itp_count,
        (select count(*) from work_item_schedule where id = 'work-item-schedule-default' and project_id = 'project-default' and work_item_id = 'work-item-category-default' and active = true) as active_schedule_count,
        (select count(*) from quality_inspection where location_zone = 'seed-quality-inspection-default' and deleted_at is null) as seed_report_count,
        (select count(*) from quality_inspection where location_zone = 'seed-quality-inspection-default' and deleted_at is null and status_code = 'open' and step_code = 'report') as seed_open_report_count
    `)
    const row = result.rows[0] as {
      module_count: string
      permission_count: string
      system_role_count: string
      project_role_count: string
      admin_id: string | null
      project_id: string | null
      system_assignment_count: string
      project_assignment_count: string
      active_itp_count: string
      active_schedule_count: string
      seed_report_count: string
      seed_open_report_count: string
    }
    if (!row || Number(row.module_count) < 1 || Number(row.permission_count) < 1 || row.system_role_count !== '1' || row.project_role_count !== '1' || !row.admin_id || !row.project_id || row.system_assignment_count !== '1' || row.project_assignment_count !== '1') {
      throw new Error('Database smoke check failed: seed records are missing.')
    }
    const identity = await resolveSystemIdentity(row.admin_id)
    if (!identity?.permissions.has('list-roles')) {
      throw new Error('Database smoke check failed: system permission resolution is missing.')
    }
    if (!identity.permissions.has('view-quality-inspection')) {
      throw new Error('Database smoke check failed: seeded admin is missing view-quality-inspection.')
    }
    if (!identity.permissions.has('view-projects')) {
      throw new Error('Database smoke check failed: seeded admin is missing view-projects.')
    }
    if (!(await hasProjectPermission(row.admin_id, row.project_id, 'create-quality-inspection'))) {
      throw new Error('Database smoke check failed: seeded admin is missing create-quality-inspection for project-default.')
    }
    if (Number(row.active_itp_count) < 1) {
      throw new Error('Database smoke check failed: active ITP for work-item-default is missing.')
    }
    if (row.active_schedule_count !== '1') {
      throw new Error('Database smoke check failed: active seeded schedule work-item-schedule-default is missing.')
    }
    if (row.seed_report_count !== '1') {
      throw new Error('Database smoke check failed: seeded Quality Inspection marker report is missing or duplicated.')
    }
    if (row.seed_open_report_count !== '1') {
      throw new Error('Database smoke check failed: seeded Quality Inspection marker report is not open/report.')
    }
  } finally {
    await closeDb()
  }
}

main().catch((error: unknown) => {
  throw error
})
