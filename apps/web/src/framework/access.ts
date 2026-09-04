import { permissions } from '@/stores/permissions'

type ResourceOperation = 'list' | 'detail' | 'create' | 'update' | 'delete'
type DeclaredPermissions = Partial<Record<ResourceOperation, string | null>>

/**
 * Capability check for custom/tree surfaces that render outside the standard
 * views. Reads the permissions declared on the resource itself, so permission
 * strings stay single-sourced in one place. Undeclared operations are allowed,
 * mirroring the view-surface contract.
 */
export function resourceCan(resource: { permissions: DeclaredPermissions }) {
  const access = permissions()
  return (operation: ResourceOperation) => {
    const declared = resource.permissions[operation]
    return declared === undefined || declared === null ? true : access.can(declared)
  }
}
