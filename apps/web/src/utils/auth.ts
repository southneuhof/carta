import { permissions } from '@/stores/permissions'

export function getCRUDPermissions(permission: string | undefined | null): { view: boolean; lookup: boolean; detail: boolean; create: boolean; update: boolean; delete: boolean } {
  if (!permission) return { view: false, lookup: false, detail: false, create: false, update: false, delete: false }
  const permissionId = permission.toLowerCase().replace(/_/g, '-')
  return {
    view: permissions().has(`view-${permissionId}`),
    lookup: permissions().has(`lookup-${permissionId}`),
    detail: permissions().has(`show-${permissionId}`),
    create: permissions().has(`create-${permissionId}`),
    update: permissions().has(`update-${permissionId}`),
    delete: permissions().has(`delete-${permissionId}`),
  }
}
