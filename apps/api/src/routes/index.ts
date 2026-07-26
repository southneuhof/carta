import { openapiRoute } from '@southneuhof/sprindle/openapi'
import { meRoute } from '../identity'
import { healthRoute } from './health/health'
import { authRoutes, domain as authDomain } from './auth/auth'
import { domain as employeesDomain, employeeModel } from './employees/employees'
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

export const domainParts = [
  authDomain,
  organizationDomain,
  employeesDomain,
  productVariantsDomain,
  productsDomain,
  rolesDomain,
  usersDomain,
] as const

const installedRoutes = [
  healthRoute,
  authRoutes.signInEmail,
  authRoutes.getSession,
  authRoutes.signOut,
  meRoute,
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
  sectionTypeModel,
  tollSectionModel,
  jobPositionModel,
] as const

// Public like /health; attach authenticated() here if the document should require a session.
export const routes = [...installedRoutes, openapiRoute(installedRoutes, { title: 'Carta API', version: '0.0.0' })] as const
