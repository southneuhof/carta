import { forbidden, unauthorized } from '@southneuhof/sprindle'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import type { RouteAuthorize, RouteHandlerArgs } from '@southneuhof/sprindle/model'
import { and, eq } from 'drizzle-orm'
import { getDb } from './db'
import { employees } from './routes/organization/organization.entity'
import { permissions, rolePermissions, roles, roleScopes, userRoles, type RoleScope } from './routes/roles/roles.entity'

/**
 * Everything a request needs to know about who is calling. Resolved once per
 * request; nothing else should read roles or sections from the database directly.
 */
export type OrgIdentity = {
  userId: string
  employeeId: string | null
  sectionId: string | null
  jobPositionId: string | null
  roleIds: string[]
  /** Widest scope among the caller's active roles. */
  scope: RoleScope
  /** Active permission codes, from active roles through active mappings. */
  permissions: ReadonlySet<string>
}

/** No roles means the narrowest scope, never the widest. */
const narrowestScope = roleScopes[roleScopes.length - 1] as RoleScope

const CACHE_KEY = 'sprindle:orgIdentity'

type SessionLike = { user?: { id?: unknown } }

function sessionUserId(session: unknown): string | null {
  const id = (session as SessionLike | null)?.user?.id
  return typeof id === 'string' && id ? id : null
}

async function resolve(userId: string): Promise<OrgIdentity> {
  const db = getDb()

  // Active at every hop, matching the reference: an inactive mapping or an
  // inactive role both remove the grant.
  const activeRoles = await db
    .select({ id: roles.id, scope: roles.scope })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(eq(userRoles.userId, userId), eq(userRoles.active, true), eq(roles.active, true)))

  const roleIds = activeRoles.map((row) => row.id)

  const scope = activeRoles.reduce<RoleScope>((widest, row) => {
    const candidate = row.scope
    const candidateRank = roleScopes.indexOf(candidate)
    if (candidateRank < 0) return widest
    return candidateRank < roleScopes.indexOf(widest) ? candidate : widest
  }, narrowestScope)

  const grantedCodes = roleIds.length
    ? await db
        .select({ code: permissions.code })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.active, true),
            eq(roles.active, true),
            eq(rolePermissions.active, true),
            eq(permissions.active, true),
          ),
        )
    : []

  const employee = await db
    .select({ id: employees.id, sectionId: employees.sectionId, jobPositionId: employees.jobPositionId })
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1)

  // No employee row is a normal state: a login can exist before the person is
  // placed in the org chart.
  const placement = employee[0]

  return {
    userId,
    employeeId: placement?.id ?? null,
    sectionId: placement?.sectionId ?? null,
    jobPositionId: placement?.jobPositionId ?? null,
    roleIds,
    scope,
    permissions: new Set(grantedCodes.map((row) => row.code)),
  }
}

/**
 * Resolves the caller's organizational context, or null when unauthenticated.
 * Memoized on the Hono context so several hooks in one pipeline share one resolution.
 */
export async function orgIdentity(args: RouteHandlerArgs): Promise<OrgIdentity | null> {
  const cached = args.c.get(CACHE_KEY as never) as Promise<OrgIdentity | null> | undefined
  if (cached) return cached

  const pending = (async () => {
    const userId = sessionUserId(await args.identity())
    return userId ? resolve(userId) : null
  })()

  args.c.set(CACHE_KEY as never, pending as never)
  return pending
}

/** Authorize hook: 403 unless the caller holds `code`. */
export function requirePermission(code: string): RouteAuthorize {
  return async (args) => {
    const identity = await orgIdentity(args)
    if (!identity?.permissions.has(code)) throw forbidden(`Missing permission "${code}".`)
  }
}

/**
 * The caller's own organizational context.
 *
 * A client cannot assemble this itself: permissions union across every active role,
 * and the roles are a many-to-many assignment. Resolving it per-role in the browser
 * would be one request per role and would still miss the employee placement.
 */
export const meRoute = defineRoute({
  path: '/me',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await orgIdentity(args)
    if (!identity) throw unauthorized()
    return args.c.json({ data: { ...identity, permissions: [...identity.permissions] } })
  },
})
