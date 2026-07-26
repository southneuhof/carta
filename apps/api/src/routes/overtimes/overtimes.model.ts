import { forbidden, HttpError } from '@southneuhof/sprindle'
import { authenticated, create, detail, list, update } from '@southneuhof/sprindle/routes'
import { defineModel } from '@southneuhof/sprindle/model'
import type { ModelRuntimeEntity } from '@southneuhof/sprindle/source'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { orgIdentity } from '../../identity'
import { overtime, overtimes } from './overtimes.entity'
import { overtimeSteps, submitOvertime, verifyOvertime } from './overtimes.routes'
import { createScopedOvertimeSource, SCOPE_KEY } from './overtimes.source'

const scopedSource = createScopedOvertimeSource(() => getDb())

// Same façade shape as notifications: `bindDomainDatabase` reassigns the real
// entity's source on every `getDb()`, so the model reads through this wrapper
// while the real entity stays in the domain part and keeps being bound normally.
const scopedEntity: ModelRuntimeEntity = {
  name: overtime.name,
  table: overtime.table,
  source: scopedSource,
}

export const overtimeModel = defineModel({
  path: '/overtimes',
  entity: scopedEntity,
  authorize: [authenticated()],
  // Scoping travels the same channel notifications settled on in plan 023:
  // `before` patches `state`, and `state.query` is what reaches the source.
  before: [async (args) => ({ query: { ...(args.state.query as object), [SCOPE_KEY]: await orgIdentity(args) } })],
  routes: {
    list: list(),
    detail: detail(),
    create: create({
      // Applicant, section and status come from the caller, never the body. The
      // entity schemas already omit them, so this is the only place they are set.
      before: [
        async (args) => {
          const identity = await orgIdentity(args)
          if (!identity?.employeeId || !identity.sectionId) {
            throw forbidden('Akun Anda belum terhubung ke data pegawai, sehingga tidak dapat mengajukan lembur.')
          }
          const body = (args.state.input ?? {}) as Record<string, unknown>
          return {
            input: {
              ...body,
              applicantEmployeeId: identity.employeeId,
              sectionId: identity.sectionId,
              createdByUserId: identity.userId,
              statusCode: 'draft',
            },
          }
        },
      ],
    }),
    update: update({
      // A submitted request is in someone else's hands; editing it underneath them
      // would change what they already approved.
      before: [
        async ({ c }) => {
          const id = c.req.param('id')
          if (!id) return
          const rows = await getDb().select({ statusCode: overtimes.statusCode }).from(overtimes).where(eq(overtimes.id, id)).limit(1)
          const found = rows[0]
          if (found && found.statusCode !== 'draft') {
            throw new HttpError(409, 'not_draft', 'Pengajuan yang sudah dikirim tidak dapat diubah.')
          }
        },
      ],
    }),
    // Registered here rather than as standalone routes: a route outside a model
    // has no `context.entity`, and both of these return through
    // `source.materialize()` so their responses match the detail wire contract.
    submit: submitOvertime,
    verify: verifyOvertime,
    steps: overtimeSteps,
    // No delete: a submitted request is a record.
  },
})
