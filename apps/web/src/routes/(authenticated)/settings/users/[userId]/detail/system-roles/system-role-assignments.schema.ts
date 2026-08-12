import { defineSchema } from '@southneuhof/is-vue-framework'
import type { WebResourceSchema } from '@southneuhof/is-vue-framework'

export type SystemRoleAssignment = {
  id: string
  roleCode: string
  name: string
  description: string | null
  active: boolean
  assigned: boolean
}

export type SystemRoleAssignmentSchema = WebResourceSchema<
  SystemRoleAssignment,
  Record<string, unknown>,
  Record<string, never>,
  Record<string, never>,
  string
>

export const systemRoleAssignmentsSchema = defineSchema<SystemRoleAssignmentSchema>({ identity: 'id' })
