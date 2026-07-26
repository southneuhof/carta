import { forbidden, HttpError, notFound } from '@southneuhof/sprindle'
import { defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext } from '@southneuhof/sprindle/model'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../db'
import { orgIdentity, type OrgIdentity } from '../../identity'
import { notifyAfterCommit, type DeliveredNotification } from '../../notifications/transport'
import { resolveRecipients } from '../notifications/recipients'
import { advanceChain, currentStep, seedChain, type ActivatedNotification } from '../verification/chain'
import { logVerifications } from '../verification/verification.entity'
import { overtimes, type OvertimeStatus } from './overtimes.entity'

const MODULE = 'overtimes'

const verifySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  description: z.string().max(2000).optional(),
})

type OvertimeRow = { id: string; sectionId: string; applicantEmployeeId: string; statusCode: OvertimeStatus; date: string }

async function loadOvertime(id: string | undefined): Promise<OvertimeRow> {
  if (!id) throw notFound()
  const rows = await getDb().select().from(overtimes).where(eq(overtimes.id, id)).limit(1)
  const found = rows[0]
  if (!found) throw notFound()
  return found as OvertimeRow
}

/**
 * Turns the chain's activated notifications into transport messages.
 *
 * Recipient resolution runs *after* commit alongside delivery, not inside the
 * transaction: it is a read for the benefit of the transport, and holding the
 * transaction open across it buys nothing.
 */
async function dispatch(activated: ActivatedNotification[]): Promise<void> {
  const messages: DeliveredNotification[] = []
  for (const item of activated) {
    messages.push({
      notificationId: item.notificationId,
      userIds: await resolveRecipients({
        recipientEmployeeId: item.recipientEmployeeId,
        jobPositionId: item.jobPositionId,
        roleId: null,
        sectionId: item.sectionId,
      }),
      title: item.title,
      content: item.content,
    })
  }
  await notifyAfterCommit(messages)
}

export const submitOvertime = defineRoute({
  path: '/:id',
  method: 'post',
  action: async (args) => {
    const identity = await orgIdentity(args)
    const record = await loadOvertime(args.c.req.param('id'))

    if (record.statusCode !== 'draft') throw new HttpError(409, 'not_draft', 'Pengajuan ini sudah dikirim.')
    if (identity?.employeeId !== record.applicantEmployeeId && identity?.scope !== 'all') {
      throw forbidden('Hanya pemohon yang dapat mengirim pengajuan ini.')
    }

    // One transaction over both writes. If seedChain throws — an unconfigured
    // module, an undetermined coordinator — the record must stay `draft` with no
    // orphaned log rows or notifications behind it.
    const activated = await getDb().transaction(async (tx) => {
      const seeded = await seedChain(tx, {
        moduleName: MODULE,
        moduleId: record.id,
        sectionId: record.sectionId,
        applicantEmployeeId: record.applicantEmployeeId,
        title: 'Pengajuan lembur menunggu verifikasi',
        content: `Pengajuan lembur tanggal ${record.date} menunggu tindakan Anda.`,
      })
      await tx.update(overtimes).set({ statusCode: 'waiting', updatedAt: new Date().toISOString() }).where(eq(overtimes.id, record.id))
      return seeded.activated
    })

    // Outside the transaction, on purpose: announcing an approval that then rolls
    // back is worse than announcing it late.
    await dispatch(activated)

    return args.c.json({ data: await args.context.entity.source.materialize({ id: record.id }, { context: args.context }) })
  },
})

/**
 * The verification timeline for one request.
 *
 * Added while building the screens (plan 025): the chain tables landed in plan 023
 * with no read endpoint and plan 024 did not add one, so the detail screen had no
 * way to render the timeline. It lives on the overtime model rather than as a
 * generic verification resource so that visibility follows the record — a caller
 * who can read the request can read its chain, and nobody else can.
 */
export const overtimeSteps = defineRoute({
  path: '/:id',
  method: 'get',
  action: async (args) => {
    const identity = await orgIdentity(args)
    const record = await loadOvertime(args.c.req.param('id'))
    if (identity?.scope !== 'all' && identity?.sectionId !== record.sectionId) {
      return args.c.json({ error: 'not_found' }, 404)
    }

    const steps = await getDb()
      .select()
      .from(logVerifications)
      .where(and(eq(logVerifications.moduleName, MODULE), eq(logVerifications.moduleId, record.id)))
      .orderBy(asc(logVerifications.orderNumber))

    return args.c.json({ data: steps, total: steps.length })
  },
})

/**
 * The reference rule, reproduced: the caller's job position matches the step **and**
 * their section matches the record's, or they are the step's named recipient, or
 * their scope is `all`.
 *
 * The section check is not redundant — without it, anyone holding the right job
 * position in any section could verify another section's requests.
 */
function mayVerify(identity: OrgIdentity | null, step: { jobPositionId: string | null; recipientEmployeeId: string | null }, record: OvertimeRow): boolean {
  if (!identity) return false
  if (identity.scope === 'all') return true
  if (step.recipientEmployeeId && identity.employeeId === step.recipientEmployeeId) return true
  if (step.jobPositionId && identity.jobPositionId === step.jobPositionId && identity.sectionId === record.sectionId) return true
  return false
}

type VerifyInput = { json: { decision: 'approved' | 'rejected'; description?: string } }

// The input type is declared rather than inferred: `defineRoute` cannot see the
// body shape a custom action reads by hand, so without this the derived RPC
// contract has no `json` and the browser call site does not type-check.
export const verifyOvertime = defineRoute<Response, ModelRuntimeContext, 'post', '/:id', VerifyInput>({
  path: '/:id',
  method: 'post',
  action: async (args) => {
    const body = verifySchema.parse(await args.c.req.json().catch(() => ({})))
    const identity = await orgIdentity(args)
    const record = await loadOvertime(args.c.req.param('id'))

    if (record.statusCode !== 'waiting') throw new HttpError(409, 'not_waiting', 'Pengajuan ini tidak sedang menunggu verifikasi.')

    const activated = await getDb().transaction(async (tx) => {
      // The step lookup and the authorization check live inside the transaction
      // with the write they guard. Outside it, two verifiers could both read the
      // same `waiting` step and both advance the chain.
      const step = await currentStep(tx, { moduleName: MODULE, moduleId: record.id })
      if (!step) throw new HttpError(409, 'no_pending_step', 'Tidak ada langkah verifikasi yang menunggu.')
      if (!mayVerify(identity, step, record)) throw forbidden('Anda tidak berwenang memverifikasi langkah ini.')

      const result = await advanceChain(tx, {
        moduleName: MODULE,
        moduleId: record.id,
        sectionId: record.sectionId,
        decision: body.decision,
        byUserId: identity!.userId,
        description: body.description,
      })
      if (result.terminal) {
        await tx.update(overtimes).set({ statusCode: result.terminal, updatedAt: new Date().toISOString() }).where(eq(overtimes.id, record.id))
      }
      return result.activated
    })

    await dispatch(activated)

    return args.c.json({ data: await args.context.entity.source.materialize({ id: record.id }, { context: args.context }) })
  },
})
