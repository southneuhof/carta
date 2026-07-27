import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import { loadVerificationSteps, type VerificationStatus, type VerificationStep } from './verification-steps.operations'

export const verificationStepLabels: Record<VerificationStatus, string> = {
  pending: 'Belum Giliran', waiting: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
}
export const verificationStepFields = defineFields<VerificationStep>()({
  orderNumber: { label: 'Urutan' },
  statusCode: { label: 'Status', read: (record) => verificationStepLabels[record.statusCode] ?? record.statusCode },
  verifiedDescription: { label: 'Catatan' },
  verifiedAt: { label: 'Diverifikasi', display: { format: 'datetime' } },
})
export const verificationSteps = defineResource({
  key: 'verification-steps', fields: verificationStepFields,
  operations: { list: async ({ searchParameters }) => loadVerificationSteps(String(searchParameters.overtime_id ?? '')) },
})
