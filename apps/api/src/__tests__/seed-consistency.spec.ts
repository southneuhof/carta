import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeDb, getDb } from '../db'
import { employees, sectionGroups, sectionRantings, tollSections } from '../routes/organization/organization.entity'
import { configVerificators } from '../routes/verification/verification.entity'
import { notifications } from '../routes/notifications/notifications.entity'
import { resolveRecipients } from '../routes/notifications/recipients'

const run = promisify(execFile)
const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * The development seed has to produce data its own configuration can actually
 * satisfy.
 *
 * This exists because it did not: the seeded chain's second step is
 * `sectionGroupHead`, no seeded employee belonged to a section group, and so the
 * seeded admin could not submit anything. Every other suite builds its own
 * fixtures, so none of them could see it — only running the real seed does.
 *
 * The suite reseeds from scratch, which is why it drops and rebuilds the schema
 * the same way the others do.
 */
describe('development seed', () => {
  beforeAll(async () => {
    await run('pnpm', ['run', 'db:reset'], { cwd: apiRoot })
    await run('pnpm', ['run', 'db:seed'], { cwd: apiRoot })
  }, 180_000)

  afterAll(() => closeDb())

  it('is idempotent', async () => {
    await expect(run('pnpm', ['run', 'db:seed'], { cwd: apiRoot })).resolves.toBeDefined()
  }, 120_000)

  it('gives every configured verificator step someone who can act on it', async () => {
    const db = getDb()
    const configured = await db.select().from(configVerificators).where(eq(configVerificators.moduleName, 'overtimes'))
    expect(configured.length).toBeGreaterThan(0)

    const staff = await db.select().from(employees)
    const applicants = staff.filter((person) => person.userId && person.active)
    expect(applicants.length).toBeGreaterThan(0)

    for (const applicant of applicants) {
      for (const step of configured) {
        if (step.verificatorType === 'jobPosition') {
          // Someone in the applicant's section must hold the named position.
          const holders = staff.filter((person) => person.sectionId === applicant.sectionId && person.jobPositionId === step.jobPositionId && person.active)
          expect(holders.length, `no one holds ${step.jobPositionId} in ${applicant.sectionId}`).toBeGreaterThan(0)
          continue
        }

        if (step.verificatorType === 'sectionGroupHead') {
          expect(applicant.sectionGroupId, `${applicant.id} belongs to no section group`).toBeTruthy()
          const group = await db.select().from(sectionGroups).where(eq(sectionGroups.id, applicant.sectionGroupId!)).limit(1)
          expect(group[0]?.koregEmployeeId, `section group ${applicant.sectionGroupId} has no coordinator`).toBeTruthy()
          continue
        }

        expect(applicant.sectionRantingId, `${applicant.id} belongs to no ranting`).toBeTruthy()
        const ranting = await db.select().from(sectionRantings).where(eq(sectionRantings.id, applicant.sectionRantingId!)).limit(1)
        expect(ranting[0]?.headEmployeeId, `ranting ${applicant.sectionRantingId} has no head`).toBeTruthy()
      }
    }
  })

  it('addresses every seeded notification to at least one real recipient', async () => {
    const rows = await getDb().select().from(notifications)
    expect(rows.length).toBeGreaterThan(0)

    // A notification nobody resolves to is indistinguishable from one that was
    // never sent, and nothing in the request path complains about it.
    const unreachable: string[] = []
    for (const row of rows) {
      const recipients = await resolveRecipients(row)
      if (recipients.length === 0) unreachable.push(`${row.id} (job=${row.jobPositionId}, role=${row.roleId}, employee=${row.recipientEmployeeId})`)
    }

    expect(unreachable, 'seeded notifications that reach nobody').toEqual([])
  })

  it('configures the chain for a section type that seeded sections actually use', async () => {
    const db = getDb()
    const configured = await db.select().from(configVerificators).where(eq(configVerificators.moduleName, 'overtimes'))

    for (const step of configured) {
      const sections = await db.select().from(tollSections).where(and(eq(tollSections.sectionTypeId, step.sectionTypeId!)))
      // A chain keyed to a section type no section has is a chain that never runs.
      expect(sections.length, `no toll section uses section type ${step.sectionTypeId}`).toBeGreaterThan(0)
    }
  })
})
