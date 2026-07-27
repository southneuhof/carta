import { rpc } from '@/framework/rpc'
import { parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'

/**
 * The caller's organizational context, as the server resolved it.
 *
 * A client cannot assemble this itself — permissions union across every active
 * role and the placement comes from the employee row — so it is fetched whole from
 * `GET /me`.
 *
 * **This is not authorization.** The server decides what a caller may do; this
 * exists so screens can decide what to *draw*, and a refused request must still be
 * handled.
 */
export type OrgIdentity = HonoResponseOf<typeof rpc.me.$get, 200>['data']

let cached: Promise<OrgIdentity | null> | undefined

/** Resolved once per page load; `refreshOrgIdentity` drops the cache after sign-in. */
export function orgIdentity(): Promise<OrgIdentity | null> {
  return (cached ??= fetchIdentity())
}

export function refreshOrgIdentity(): void {
  cached = undefined
}

async function fetchIdentity(): Promise<OrgIdentity | null> {
  try {
    const payload = await parseHonoResponse<typeof rpc.me.$get>(await rpc.me.$get())
    return payload.data
  } catch {
    return null
  }
}
