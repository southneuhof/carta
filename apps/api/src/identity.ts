import { forbidden, notFound, unauthorized } from '@southneuhof/sprindle'
import { authenticated, defineRoute } from '@southneuhof/sprindle/routes'
import type { ModelRuntimeContext, RouteAuthorize, RouteHandlerArgs } from '@southneuhof/sprindle/model'
import type { TypedResponse } from 'hono'
import type { PermissionCode } from './authorization/catalog'
import { resolveIdentity, type OrgIdentity } from './authorization'

export type { OrgIdentity }

type SessionLike = { user?: { id?: unknown } }
type IdentityArgs = Pick<RouteHandlerArgs, 'c' | 'identity'>
const CACHE_KEY = 'carta:orgIdentity'

function sessionUserId(session: unknown): string | null {
  const id = (session as SessionLike | null)?.user?.id
  return typeof id === 'string' && id ? id : null
}

export async function orgIdentity(args: IdentityArgs): Promise<OrgIdentity | null> {
  const cached = args.c.get(CACHE_KEY as never) as Promise<OrgIdentity | null> | undefined
  if (cached) return cached
  const pending = (async () => {
    const userId = sessionUserId(await args.identity())
    return userId ? resolveIdentity(userId) : null
  })()
  args.c.set(CACHE_KEY as never, pending as never)
  return pending
}

export async function requireOrgIdentity(args: IdentityArgs): Promise<OrgIdentity> {
  const identity = await orgIdentity(args)
  if (!identity) throw unauthorized()
  return identity
}

export function requirePathParam(args: RouteHandlerArgs, name: string): string {
  const id = args.c.req.param(name)
  if (!id) throw notFound()
  return id
}

export function requirePermission(code: PermissionCode): RouteAuthorize {
  return async (args) => {
    const identity = await orgIdentity(args)
    if (!identity) throw unauthorized()
    if (!identity.permissions.has(code)) throw forbidden(`Missing permission "${code}".`)
  }
}


type PublicOrgIdentity = Omit<OrgIdentity, 'permissions'> & { permissions: PermissionCode[] }
type MeOutput = TypedResponse<{ data: PublicOrgIdentity }, 200, 'json'> | TypedResponse<{ error: string; message?: string }, 401, 'json'>

export const meRoute = defineRoute<MeOutput, ModelRuntimeContext, 'get', '/me', { query?: Record<string, never> }>({
  path: '/me',
  method: 'get',
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await orgIdentity(args)
    if (!identity) return args.c.json({ error: 'unauthorized' }, 401)
    return args.c.json({ data: { ...identity, permissions: [...identity.permissions] } }, 200)
  },
})
