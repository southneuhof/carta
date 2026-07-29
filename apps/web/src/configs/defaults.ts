import type { FrameworkFieldDefaultsInput } from '@southneuhof/is-vue-framework'

const activeOptions = [
  { name: 'Aktif', id: true },
  { name: 'Nonaktif', id: false },
] as const

const statusOptions = [
  { name: 'Aktif', id: 'active' },
  { name: 'Nonaktif', id: 'non_active' },
] as const

const statusDisplayOptions = {
  active: { color: 'success', label: 'Aktif' },
  non_active: { color: 'neutral', label: 'Nonaktif' },
  expired: { color: 'error', label: 'Kadaluwarsa' },
  expiring_soon: { color: 'warning', label: 'Akan Kadaluwarsa' },
} as const

/**
 * Web-app field defaults.
 *
 * Keys use the normalized camelCase record shape consumed by resources. Field
 * catalogs remain authoritative: their definitions override these defaults.
 * Validation belongs to resource schemas and initial values to form state.
 */
export const appFieldDefaults = {
  fields: {
    title: { label: 'Judul', form: { renderer: 'text', props: { required: true } } },
    name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
    fullName: { form: { renderer: 'text', props: { required: true } } },
    username: { form: { renderer: 'text', props: { required: true } } },
    code: { label: 'Kode', form: { renderer: 'text', props: { required: true } } },
    email: { form: { renderer: 'text', props: { required: true, type: 'email' } } },
    telephone: { form: { renderer: 'text', props: { required: true, type: 'tel' } } },
    description: {
      label: 'Keterangan',
      table: { class: 'line-clamp-3 overflow-ellipsis' },
      form: { renderer: 'textarea' },
    },
    active: {
      label: 'Status',
      display: {
        renderer: 'chip',
        props: {
          options: {
            true: { color: 'success', label: 'Aktif' },
            false: { color: 'error', label: 'Nonaktif' },
          },
        },
      },
      form: { renderer: 'radio', props: { required: true, data: activeOptions } },
    },
    statusCode: {
      label: 'Status',
      display: { renderer: 'chip', props: { options: statusDisplayOptions } },
      form: { renderer: 'radio', props: { required: true, data: statusOptions } },
    },
    status: { table: { align: 'center' } },
    createdAt: {
      label: 'Dibuat',
      read: (record) => record.createdAt,
      display: { format: 'datetime' },
      table: { class: 'min-w-max whitespace-nowrap' },
    },
    updatedAt: {
      label: 'Diperbarui Pada',
      read: (record) => record.updatedAt,
      display: { format: 'datetime' },
      table: { class: 'min-w-max whitespace-nowrap' },
    },
    publishedAt: {
      label: 'Diterbitkan Pada',
      display: { format: 'datetime' },
      table: { class: 'min-w-max whitespace-nowrap' },
    },
    date: {
      label: 'Tanggal',
      display: { format: 'date' },
      table: { class: 'w-max max-w-sm' },
    },
    startDate: { label: 'Tanggal Mulai', form: { renderer: 'date' } },
    endDate: { label: 'Tanggal Selesai', form: { renderer: 'date' } },
    year: { label: 'Tahun', form: { renderer: 'year' } },
    file: { label: 'File' },
    updatedBy: { label: 'Diperbarui Oleh', read: (record) => record.relUpdatedBy },
    createdBy: { label: 'Dibuat Oleh', read: (record) => record.relCreatedBy },
    departmentId: { label: 'Unit Kerja' },
    number: { label: 'Nomor' },
    sectionName: { label: 'Ruas' },
    sectionId: { label: 'Ruas', table: { class: 'w-max max-w-sm' } },
    gateName: { label: 'Gerbang' },
    gateId: { label: 'Gerbang' },
    assetId: { table: { class: 'w-max max-w-sm' } },
    locationId: { table: { class: 'w-max max-w-sm' } },
    startMonth: { label: 'Periode Mulai' },
    endMonth: { label: 'Periode Selesai' },
    approvalDescription: { label: 'Keterangan', display: { renderer: 'html' } },
    verificationDescription: { label: 'Keterangan', display: { renderer: 'html' } },
    submissionDescription: { label: 'Keterangan', display: { renderer: 'html' } },
    arrayApprovalAttachment: { label: 'Lampiran', display: { renderer: 'file' } },
    arrayVerificationAttachment: { label: 'Lampiran', display: { renderer: 'file' } },
    arraySubmissionAttachment: { label: 'Lampiran', display: { renderer: 'file' } },
    arrayClauses: { detail: { renderer: 'array-clauses' } },
  },
} satisfies FrameworkFieldDefaultsInput
