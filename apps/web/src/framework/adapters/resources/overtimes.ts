import { defineFields, defineResource, fromZod } from '@southneuhof/is-vue-framework'
import { overtime } from '@southneuhof/api/routes/overtimes/overtimes.entity'
import { rpc } from '@/framework/rpc'
import { createRpcOperations } from './rpcResource'
import { parseRpcResponse } from './rpcRoute'
import type { RpcCRUDRoute } from './rpcRoute'

export type OvertimeStatus = 'draft' | 'waiting' | 'approved' | 'rejected'

export interface Overtime extends Record<string, unknown> {
  id: string
  sectionId: string
  applicantEmployeeId: string
  date: string
  startTime: string
  estimatedMinutes: number
  description: string | null
  statusCode: OvertimeStatus
  applicant?: { id: string; fullName: string } | null
  section?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export interface OvertimeQuery extends Record<string, unknown> {
  page?: number
  limit?: number
  search?: string
  statusCode?: OvertimeStatus
}

export interface OvertimeDraft extends Record<string, unknown> {
  date: string
  startTime: string
  estimatedMinutes: number
  description?: string | null
}

export const overtimeStatusLabels: Record<OvertimeStatus, string> = {
  draft: 'Draft',
  waiting: 'Menunggu Verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const overtimeFields = defineFields<Overtime, OvertimeDraft>()({
  date: { label: 'Tanggal', table: { sortable: true }, form: { renderer: 'date' } },
  startTime: { label: 'Jam Mulai', form: { renderer: 'text' } },
  estimatedMinutes: { label: 'Durasi (menit)', form: { renderer: 'number' } },
  applicantEmployeeId: {
    label: 'Pemohon',
    // The joined employee name when it is hydrated, the identity otherwise.
    read: (record) => (record.applicant as { fullName?: string } | undefined)?.fullName ?? record.applicantEmployeeId,
    form: false,
  },
  statusCode: {
    label: 'Status',
    read: (record) => overtimeStatusLabels[record.statusCode as OvertimeStatus] ?? record.statusCode,
    form: false,
  },
  description: { label: 'Keterangan', form: { renderer: 'text' } },
  createdAt: { label: 'Dibuat', display: { format: 'datetime' }, form: false },
})

/**
 * Applicant, section and status are derived from the caller by the API and are
 * absent from the form for that reason — see the entity's `derivedFromCaller`.
 */
export const overtimes = defineResource<Overtime, OvertimeQuery, OvertimeDraft, OvertimeDraft>({
  key: 'overtimes',
  fields: overtimeFields,
  operations: createRpcOperations<Overtime, OvertimeQuery, OvertimeDraft, OvertimeDraft>(rpc.overtimes as unknown as RpcCRUDRoute),
  table: { fields: ['date', 'startTime', 'estimatedMinutes', 'applicantEmployeeId', 'statusCode'] },
  detail: { fields: ['date', 'startTime', 'estimatedMinutes', 'applicantEmployeeId', 'statusCode', 'description', 'createdAt'] },
  form: { fields: ['date', 'startTime', 'estimatedMinutes', 'description'] },
  // The authoritative server schemas, imported from the entity module itself.
  schemas: {
    create: fromZod<OvertimeDraft>(overtime.schemas.create),
    update: fromZod<OvertimeDraft>(overtime.schemas.update),
  },
  routes: {
    list: '/hr/overtimes',
    create: '/hr/overtimes/new',
    detail: (id) => `/hr/overtimes/${id}`,
    update: (id) => `/hr/overtimes/${id}/edit`,
  },
})

export interface VerificationStep extends Record<string, unknown> {
  id: string
  orderNumber: number
  verificatorType: string
  jobPositionId: string | null
  recipientEmployeeId: string | null
  statusCode: 'pending' | 'waiting' | 'approved' | 'rejected'
  verifiedByUserId: string | null
  verifiedAt: string | null
  verifiedDescription: string | null
}

export const verificationStepLabels: Record<VerificationStep['statusCode'], string> = {
  pending: 'Belum Giliran',
  waiting: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const verificationStepFields = defineFields<VerificationStep>()({
  orderNumber: { label: 'Urutan' },
  statusCode: {
    label: 'Status',
    read: (record) => verificationStepLabels[record.statusCode as VerificationStep['statusCode']] ?? record.statusCode,
  },
  verifiedDescription: { label: 'Catatan' },
  verifiedAt: { label: 'Diverifikasi', display: { format: 'datetime' } },
})

/**
 * The verification timeline of one request: an ordinary collection scoped by an
 * ordinary `searchParameters` entry, not a nested-resource construct.
 */
export const verificationSteps = defineResource<VerificationStep>({
  key: 'verification-steps',
  fields: verificationStepFields,
  operations: {
    list: async ({ searchParameters }) => {
      const id = String(searchParameters.overtime_id ?? '')
      if (!id) return { data: [] }
      const payload = await parseRpcResponse<{ data: VerificationStep[]; total?: number }>(await rpc.overtimes.steps[':id'].$get({ param: { id } }))
      return { data: payload.data, meta: { total: payload.total } }
    },
  },
})

/**
 * Loads one request directly.
 *
 * The detail screen needs the record *before* it renders, because which workflow
 * controls exist depends on `statusCode`, and `DetailProps` does not surface the
 * record it loaded to its parent. The route loads it here and hands it back to
 * `DetailView` through `data`, so there is still exactly one fetch.
 */
export async function loadOvertime(id: string): Promise<Overtime> {
  const payload = await parseRpcResponse<{ data: Overtime }>(await rpc.overtimes.detail[':id'].$get({ param: { id } }))
  return payload.data
}

/** Sends a draft into its verification chain. The caller owns optimistic state. */
export async function submitOvertime(id: string): Promise<void> {
  await parseRpcResponse(await rpc.overtimes.submit[':id'].$post({ param: { id } }))
}

/**
 * Records a decision on the current chain step.
 *
 * The server is authoritative about who may do this; the screen only decides what
 * to render, and a refusal still has to surface as an error.
 */
export async function verifyOvertime(id: string, decision: 'approved' | 'rejected', description?: string): Promise<void> {
  await parseRpcResponse(await rpc.overtimes.verify[':id'].$post({ param: { id }, json: { decision, description } }))
}
