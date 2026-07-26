import { and, eq, isNotNull } from 'drizzle-orm'
import { getDb } from '../../db'
import { employees } from '../organization/organization.entity'
import { roles, userRoles } from '../roles/roles.entity'

export type NotificationTarget = {
  recipientEmployeeId: string | null
  jobPositionId: string | null
  roleId: string | null
  sectionId: string | null
}

/**
 * Every user who should receive this notification, deduplicated.
 *
 * Three rules, applied in order and **unioned**. The reference implementation
 * (`app/Jobs/sendPushNotif.php`) assigns rather than appends in each branch, so a
 * row with both a job position and a role only ever fans out to the role. That is
 * a bug in the reference, not a specification — a notification that names two
 * targets means both. Consequence worth knowing: if real data is ever imported,
 * such rows fan out more widely here than they did there.
 *
 * Employees with no `userId` are skipped rather than treated as an error. That is
 * the person-without-login case, which is normal in the org chart.
 */
export async function resolveRecipients(target: NotificationTarget): Promise<string[]> {
  const db = getDb()
  const found = new Set<string>()

  if (target.recipientEmployeeId) {
    const rows = await db
      .select({ userId: employees.userId })
      .from(employees)
      .where(and(eq(employees.id, target.recipientEmployeeId), isNotNull(employees.userId)))
    for (const row of rows) if (row.userId) found.add(row.userId)
  }

  if (target.jobPositionId && target.sectionId) {
    const rows = await db
      .select({ userId: employees.userId })
      .from(employees)
      .where(
        and(
          eq(employees.jobPositionId, target.jobPositionId),
          eq(employees.sectionId, target.sectionId),
          eq(employees.active, true),
          isNotNull(employees.userId),
        ),
      )
    for (const row of rows) if (row.userId) found.add(row.userId)
  }

  if (target.roleId && target.sectionId) {
    const rows = await db
      .select({ userId: employees.userId })
      .from(employees)
      .innerJoin(userRoles, eq(userRoles.userId, employees.userId))
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(userRoles.roleId, target.roleId),
          eq(userRoles.active, true),
          eq(roles.active, true),
          eq(employees.sectionId, target.sectionId),
          eq(employees.active, true),
        ),
      )
    for (const row of rows) if (row.userId) found.add(row.userId)
  }

  return [...found]
}
