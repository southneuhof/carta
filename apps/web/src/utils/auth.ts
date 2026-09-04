import { permissions } from '@/stores/permissions'

export function getCRUDPermissions(permission: string | undefined | null): { view: boolean; lookup: boolean; detail: boolean; create: boolean; update: boolean; delete: boolean } {
  if (!permission) return { view: false, lookup: false, detail: false, create: false, update: false, delete: false }
  const permissionId = permission.toLowerCase().replace(/_/g, '-')
  return {
    view: permissions().can(`view-${permissionId}`),
    lookup: permissions().can(`lookup-${permissionId}`),
    detail: permissions().can(`show-${permissionId}`),
    create: permissions().can(`create-${permissionId}`),
    update: permissions().can(`update-${permissionId}`),
    delete: permissions().can(`delete-${permissionId}`),
  }
}
