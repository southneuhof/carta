import { healthRoute } from './health/health'
import { loginRoute } from './auth/auth'
import { domain as productVariantsDomain } from './product-variants/product-variants'
import { domain as productsDomain, productModel } from './products/products'
import { assignRolePermission, domain as rolesDomain, listRolePermissions, revokeRolePermission, roleModel } from './roles/roles'
import { domain as usersDomain, userModel } from './users/users'

export const domainParts = [productVariantsDomain, productsDomain, rolesDomain, usersDomain] as const
export const routes = [healthRoute, loginRoute, listRolePermissions, assignRolePermission, revokeRolePermission, productModel, roleModel, userModel] as const
