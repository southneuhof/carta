import { openapiRoute } from '@southneuhof/sprindle/openapi'
import { meRoute } from '../identity'
import { healthRoute } from './health/health'
import { authRoutes, domain as authDomain } from './auth/auth'
import { domain as employeesDomain, employeeModel } from './employees/employees'
import { domain as notificationsDomain, markSeen, notificationDetail, notificationModel, unreadCount } from './notifications/notifications'
import { domain as overtimesDomain, overtimeModel } from './overtimes/overtimes'
import { domain as verificationDomain } from './verification/verification'
import {
  domain as organizationDomain,
  jobPositionModel,
  sectionTypeModel,
  tollSectionModel,
} from './organization/organization'
import { domain as productVariantsDomain } from './product-variants/product-variants'
import { domain as productsDomain, productModel } from './products/products'
import {
  assignRolePermission,
  assignUserRole,
  domain as rolesDomain,
  listRolePermissions,
  listUserRoles,
  revokeRolePermission,
  revokeUserRole,
  roleModel,
} from './roles/roles'
import { domain as usersDomain, userModel } from './users/users'
import { presignedUploadRoute } from './files/files'

export const domainParts = [
  authDomain,
  organizationDomain,
  employeesDomain,
  productVariantsDomain,
  productsDomain,
  rolesDomain,
  usersDomain,
  verificationDomain,
  notificationsDomain,
  overtimesDomain,
] as const

const installedRoutes = [
  healthRoute,
  authRoutes.signInEmail,
  authRoutes.getSession,
  authRoutes.signOut,
  meRoute,
  presignedUploadRoute,
  listRolePermissions,
  assignRolePermission,
  revokeRolePermission,
  listUserRoles,
  assignUserRole,
  revokeUserRole,
  productModel,
  roleModel,
  userModel,
  employeeModel,
  unreadCount,
  markSeen,
  notificationDetail,
  notificationModel,
  overtimeModel,
  sectionTypeModel,
  tollSectionModel,
  jobPositionModel,
] as const

// Public like /health; attach authenticated() here if the document should require a session.
export const routes = [...installedRoutes, openapiRoute(installedRoutes, { title: 'Carta API', version: '0.0.0' })] as const
