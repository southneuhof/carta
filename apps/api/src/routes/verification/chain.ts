import { validationError } from '@southneuhof/sprindle'
import type { getDb } from '../../db'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { employees, sectionGroups, sectionRantings, tollSections } from '../organization/organization.entity'
import { notifications } from '../notifications/notifications.entity'
import { configVerificators, logVerifications, type VerificatorType } from './verification.entity'

/**
 * Every function takes a transaction handle so the caller owns the boundary.
 * Sprindle's transactional guarantee covers only a source's own create and update;
 * a custom route's writes are the application's to enclose.
 *
 * The handle is Drizzle's own transaction type, derived from `getDb` rather than
 * restated, so a schema change cannot make this drift into `any`.
 */
export type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0]

export type ChainStep = {
  id: string
  orderNumber: number
  verificatorType: VerificatorType
  jobPositionId: string | null
  recipientEmployeeId: string | null
  statusCode: string
}

export type ActivatedNotification = {
  notificationId: string
  title: string
  content: string
  recipientEmployeeId: string | null
  jobPositionId: string | null
  sectionId: string
}

/**
 * Seeds the chain for one record. Step 1 becomes `waiting`, the rest `pending`.
 *
 * **Divergence from the reference, deliberate.** The reference system seeds the
 * chain lazily inside the first approval, using an `order_number == 0` sentinel row
 * to mean "not yet seeded". Here the chain exists before anyone acts on it and
 * `orderNumber` starts at 1, so there is no sentinel and no branch that has to
 * decide whether the chain is real yet.
 *
 * One notification is inserted per step at the same time: step 1 `unseen`, later
 * steps `unset`. The reference instead rewrites a single row back to `unseen` as
 * each step activates. Same observable behavior, but the timeline survives — and
 * `unset` exists precisely for the steps whose turn has not come.
 */
export async function seedChain(
  tx: Tx,
  args: { moduleName: string; moduleId: string; sectionId: string; applicantEmployeeId: string; title: string; content: string },
): Promise<{ steps: ChainStep[]; activated: ActivatedNotification[] }> {
  const section = await tx.select({ sectionTypeId: tollSections.sectionTypeId }).from(tollSections).where(eq(tollSections.id, args.sectionId)).limit(1)
  const sectionTypeId = section[0]?.sectionTypeId ?? null

  const configured = await tx
    .select()
    .from(configVerificators)
    .where(and(eq(configVerificators.moduleName, args.moduleName), sectionTypeId ? eq(configVerificators.sectionTypeId, sectionTypeId) : undefined))
    .orderBy(asc(configVerificators.orderNumber))

  // Auto-approving an unconfigured module would silently skip verification, which
  // is the one failure nobody notices until an audit.
  if (configured.length === 0) {
    throw validationError(`Belum ada rantai verifikasi untuk modul "${args.moduleName}" pada tipe ruas ini.`)
  }

  const applicant = await tx
    .select({ sectionGroupId: employees.sectionGroupId, sectionRantingId: employees.sectionRantingId })
    .from(employees)
    .where(eq(employees.id, args.applicantEmployeeId))
    .limit(1)
  const placement = applicant[0]

  const steps: ChainStep[] = []
  const activated: ActivatedNotification[] = []

  for (const config of configured) {
    const recipientEmployeeId = await resolveRecipientEmployee(tx, config.verificatorType, placement)
    const isFirst = steps.length === 0

    const logRow = await tx
      .insert(logVerifications)
      .values({
        moduleName: args.moduleName,
        moduleId: args.moduleId,
        orderNumber: config.orderNumber,
        verificatorType: config.verificatorType,
        jobPositionId: config.jobPositionId,
        recipientEmployeeId,
        statusCode: isFirst ? 'waiting' : 'pending',
      })
      .returning()

    const created = logRow[0]!
    steps.push({
      id: created.id,
      orderNumber: created.orderNumber,
      verificatorType: created.verificatorType,
      jobPositionId: created.jobPositionId,
      recipientEmployeeId: created.recipientEmployeeId,
      statusCode: created.statusCode,
    })

    const notificationRow = await tx
      .insert(notifications)
      .values({
        recipientEmployeeId,
        jobPositionId: config.verificatorType === 'jobPosition' ? config.jobPositionId : null,
        sectionId: args.sectionId,
        title: args.title,
        content: args.content,
        statusCode: isFirst ? 'unseen' : 'unset',
        notificationType: 'verification',
        moduleName: args.moduleName,
        moduleId: args.moduleId,
        payload: { orderNumber: config.orderNumber },
      })
      .returning()

    if (isFirst) {
      const notification = notificationRow[0]!
      activated.push({
        notificationId: notification.id,
        title: notification.title,
        content: notification.content,
        recipientEmployeeId: notification.recipientEmployeeId,
        jobPositionId: notification.jobPositionId,
        sectionId: args.sectionId,
      })
    }
  }

  return { steps, activated }
}

/** The step currently awaiting action, or null when the chain is finished. */
export async function currentStep(tx: Tx, args: { moduleName: string; moduleId: string }): Promise<ChainStep | null> {
  const rows = await tx
    .select()
    .from(logVerifications)
    .where(and(eq(logVerifications.moduleName, args.moduleName), eq(logVerifications.moduleId, args.moduleId), eq(logVerifications.statusCode, 'waiting')))
    .orderBy(asc(logVerifications.orderNumber))
    .limit(1)

  const found = rows[0]
  if (!found) return null
  return {
    id: found.id,
    orderNumber: found.orderNumber,
    verificatorType: found.verificatorType,
    jobPositionId: found.jobPositionId,
    recipientEmployeeId: found.recipientEmployeeId,
    statusCode: found.statusCode,
  }
}

/**
 * Records a decision on the current step and activates the next one when approved.
 * Returns the resulting terminal status, or null while the chain continues.
 *
 * Dispatch is not this function's job: it returns which notifications became
 * active and the caller sends them after the transaction commits.
 */
export async function advanceChain(
  tx: Tx,
  args: { moduleName: string; moduleId: string; sectionId: string; decision: 'approved' | 'rejected'; byUserId: string; description?: string },
): Promise<{ terminal: 'approved' | 'rejected' | null; activated: ActivatedNotification[] }> {
  const step = await currentStep(tx, args)
  if (!step) throw validationError('Tidak ada langkah verifikasi yang menunggu.')

  const now = new Date().toISOString()
  await tx
    .update(logVerifications)
    .set({ statusCode: args.decision, verifiedByUserId: args.byUserId, verifiedAt: now, verifiedDescription: args.description ?? null, updatedAt: now })
    .where(eq(logVerifications.id, step.id))

  // The decided step's notifications are read by definition — the decision is the
  // reading. Leaving them unseen keeps a badge lit for work already done.
  await tx
    .update(notifications)
    .set({ statusCode: 'seen', updatedAt: now })
    .where(and(eq(notifications.moduleName, args.moduleName), eq(notifications.moduleId, args.moduleId), inArray(notifications.statusCode, ['unseen'])))

  if (args.decision === 'rejected') return { terminal: 'rejected', activated: [] }

  const remaining = await tx
    .select()
    .from(logVerifications)
    .where(and(eq(logVerifications.moduleName, args.moduleName), eq(logVerifications.moduleId, args.moduleId), eq(logVerifications.statusCode, 'pending')))
    .orderBy(asc(logVerifications.orderNumber))
    .limit(1)

  const next = remaining[0]
  if (!next) return { terminal: 'approved', activated: [] }

  await tx.update(logVerifications).set({ statusCode: 'waiting', updatedAt: now }).where(eq(logVerifications.id, next.id))

  // Keyed on the step's order number, not its recipient: a `jobPosition` step has
  // no named recipient, so a recipient predicate would match nothing for it.
  const activated = await tx
    .update(notifications)
    .set({ statusCode: 'unseen', updatedAt: now })
    .where(
      and(
        eq(notifications.moduleName, args.moduleName),
        eq(notifications.moduleId, args.moduleId),
        eq(notifications.statusCode, 'unset'),
        sql`${notifications.payload}->>'orderNumber' = ${String(next.orderNumber)}`,
      ),
    )
    .returning()

  return {
    terminal: null,
    activated: activated.map((row) => ({
      notificationId: row.id,
      title: row.title,
      content: row.content,
      recipientEmployeeId: row.recipientEmployeeId,
      jobPositionId: row.jobPositionId,
      sectionId: args.sectionId,
    })),
  }
}

async function resolveRecipientEmployee(
  tx: Tx,
  verificatorType: VerificatorType,
  placement: { sectionGroupId: string | null; sectionRantingId: string | null } | undefined,
): Promise<string | null> {
  // A jobPosition step names no individual: it targets everyone holding that
  // position in the section, which is what the notification's jobPositionId says.
  if (verificatorType === 'jobPosition') return null

  if (verificatorType === 'sectionGroupHead') {
    if (!placement?.sectionGroupId) throw validationError('Regu Anda belum ditentukan, sehingga koordinator regu tidak dapat ditemukan.')
    const rows = await tx.select({ koregEmployeeId: sectionGroups.koregEmployeeId }).from(sectionGroups).where(eq(sectionGroups.id, placement.sectionGroupId)).limit(1)
    const head = rows[0]?.koregEmployeeId
    // Failing here beats stranding the record mid-chain with nobody able to act.
    if (!head) throw validationError('Koordinator Regu Anda belum ditentukan.')
    return head
  }

  if (!placement?.sectionRantingId) throw validationError('Ranting Anda belum ditentukan, sehingga kepala ranting tidak dapat ditemukan.')
  const rows = await tx.select({ headEmployeeId: sectionRantings.headEmployeeId }).from(sectionRantings).where(eq(sectionRantings.id, placement.sectionRantingId)).limit(1)
  const head = rows[0]?.headEmployeeId
  if (!head) throw validationError('Kepala Ranting Anda belum ditentukan.')
  return head
}
