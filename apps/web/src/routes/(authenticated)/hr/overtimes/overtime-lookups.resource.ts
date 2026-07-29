import { defineFields, defineResource } from '@southneuhof/is-vue-framework'
import {
  applicantOperations,
  jobPositionOperations,
  tollSectionOperations,
  type Applicant,
  type JobPosition,
  type TollSection,
} from './overtime-lookups.operations'

export const tollSections = defineResource({
  key: 'overtime-toll-sections',
  fields: defineFields<TollSection>()({
    name: { label: 'Ruas' },
  }),
  capabilities: {
    list: { handler: tollSectionOperations.list, permission: null },
    detail: { handler: tollSectionOperations.detail, permission: null },
  },
})

export const applicants = defineResource({
  key: 'overtime-applicants',
  fields: defineFields<Applicant>()({
    fullName: { label: 'Karyawan' },
  }),
  capabilities: {
    list: { handler: applicantOperations.list, permission: null },
    detail: { handler: applicantOperations.detail, permission: null },
  },
})

export const jobPositions = defineResource({
  key: 'overtime-job-positions',
  fields: defineFields<JobPosition>()({
    name: { label: 'Jabatan' },
  }),
  capabilities: {
    list: { handler: jobPositionOperations.list, permission: null },
    detail: { handler: jobPositionOperations.detail, permission: null },
  },
})
