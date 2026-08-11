import { forbidden, unauthorized } from '@southneuhof/sprindle'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import type { RouteAuthorize, RouteHandlerArgs } from '@southneuhof/sprindle/model'
import type { PermissionCode } from './authorization/catalog'
import { hasProjectPermission, requireProjectRecord, resolveSystemIdentity, type SystemIdentity } from './authorization'

export type OrgIdentity = SystemIdentity

type SessionLike = { user?: { id?: unknown } }
const CACHE_KEY = 'adsHk:orgIdentity'

function sessionUserId(session: unknown): string | null {
  const id = (session as SessionLike | null)?.user?.id
  return typeof id === 'string' && id ? id : null
}

export async function orgIdentity(args: RouteHandlerArgs): Promise<OrgIdentity | null> {
  const cached = args.c.get(CACHE_KEY as never) as Promise<OrgIdentity | null> | undefined
  if (cached) return cached
  const pending = (async () => {
    const userId = sessionUserId(await args.identity())
    return userId ? resolveSystemIdentity(userId) : null
  })()
  args.c.set(CACHE_KEY as never, pending as never)
  return pending
}

export function requirePermission(code: PermissionCode): RouteAuthorize {
  return async (args) => {
    const identity = await orgIdentity(args)
    if (!identity) throw unauthorized()
    if (!identity.permissions.has(code)) throw forbidden(`Missing permission "${code}".`)
  }
}

export { hasProjectPermission }

export function requireProjectPermission(projectParameter: string, code: PermissionCode): RouteAuthorize {
  return async (args) => {
    const identity = await orgIdentity(args)
    if (!identity) throw unauthorized()
    const projectId = args.c.req.param(projectParameter)
    if (!projectId) throw forbidden(`Missing project permission "${code}".`)
    await requireProjectRecord(identity.userId, projectId, code)
  }
}

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
