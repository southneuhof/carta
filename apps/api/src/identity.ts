import { forbidden, notFound, unauthorized } from '@southneuhof/sprindle'
import type { FileRequestArgs, RouteParameters } from '@southneuhof/sprindle'
import type { PermissionCode } from './authorization/catalog'
import { resolveIdentity, type OrgIdentity } from './authorization'

export type { OrgIdentity }

type SessionLike = { user?: { id?: unknown } }
type IdentityArgs = Pick<FileRequestArgs<RouteParameters, object>, 'c' | 'identity'>
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

export function requirePathParam(args: IdentityArgs, name: string): string {
  const id = args.c.req.param(name)
  if (!id) throw notFound()
  return id
}

export function requirePermission(code: PermissionCode) {
  return async (args) => {
    const identity = await orgIdentity(args)
    if (!identity) throw unauthorized()
    if (!identity.permissions.has(code)) throw forbidden(`Missing permission "${code}".`)
  }
}
