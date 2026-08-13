import { validationError } from '@southneuhof/sprindle'
import { accessibleProjectIds, coveredProjectIds, type ProjectOperation, type ProjectOperationMap } from './authorization'
import { permissionByCode, realmForPermission, type PermissionCode } from './authorization/catalog'

export function parseOwnerListPermission(query: Record<string, unknown>) {
  const value = query.permission
  if (value === undefined || value === '') return undefined
  const code = String(value)
  if (!(code in permissionByCode) || realmForPermission(code as PermissionCode) !== 'project') {
    throw validationError('permission must be a project permission.')
  }
  return code as PermissionCode
}

export function ownerListProjectScope(userId: string, query: Record<string, unknown>) {
  const permission = parseOwnerListPermission(query)
  return permission ? accessibleProjectIds(userId, permission) : coveredProjectIds(userId)
}

export function ownerAllowedOperations(
  permissions: ReadonlySet<PermissionCode>,
  covered: boolean,
  operationMap: ProjectOperationMap,
): ProjectOperation[] {
  if (!covered) return []
  return (Object.entries(operationMap) as Array<[ProjectOperation, PermissionCode]>)
    .filter(([, code]) => permissions.has(code))
    .map(([operation]) => operation)
}

export function coerceBooleanQuery(query: Record<string, unknown>, key: string) {
  const value = query[key]
  if (value === undefined) return
  if (value === true || value === 'true') {
    query[key] = true
    return
  }
  if (value === false || value === 'false') {
    query[key] = false
    return
  }
  throw validationError(`${key} must be true or false.`)
}
