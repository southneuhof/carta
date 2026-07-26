import { openapiRoute } from '@southneuhof/sprindle/openapi'
import { healthRoute } from './health/health'
import { authRoutes, domain as authDomain } from './auth/auth'
import { domain as productVariantsDomain } from './product-variants/product-variants'
import { domain as productsDomain, productModel } from './products/products'
import { assignRolePermission, domain as rolesDomain, listRolePermissions, revokeRolePermission, roleModel } from './roles/roles'
import { domain as usersDomain, userModel } from './users/users'

export const domainParts = [authDomain, productVariantsDomain, productsDomain, rolesDomain, usersDomain] as const

const installedRoutes = [healthRoute, authRoutes.signInEmail, authRoutes.getSession, authRoutes.signOut, listRolePermissions, assignRolePermission, revokeRolePermission, productModel, roleModel, userModel] as const

// Public like /health; attach authenticated() here if the document should require a session.
export const routes = [...installedRoutes, openapiRoute(installedRoutes, { title: 'Carta API', version: '0.0.0' })] as const
