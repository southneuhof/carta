import { ref, shallowRef } from 'vue'
import { parseHonoResponse, type HonoResponseOf } from '@southneuhof/is-vue-framework/hono'
import { permissions } from '@/stores/permissions'
import { rpc } from '@/framework/rpc'

export type OrgIdentity = HonoResponseOf<typeof rpc.me.$get, 200>['data']
export type IdentityStatus = 'unknown' | 'authenticated' | 'anonymous' | 'failed'

export const identity = shallowRef<OrgIdentity | null>(null)
export const identityStatus = ref<IdentityStatus>('unknown')
export const identityError = shallowRef<unknown>()

let pending: Promise<OrgIdentity | null> | undefined
let pendingToken: object | undefined
let revision = 0

function setAnonymous() {
  identity.value = null
  identityStatus.value = 'anonymous'
  identityError.value = undefined
  permissions().clear()
}

export function loadIdentity(): Promise<OrgIdentity | null> {
  if (pending) return pending
  if (identityStatus.value === 'authenticated') return Promise.resolve(identity.value)
  if (identityStatus.value === 'anonymous') return Promise.resolve(null)
  if (identityStatus.value === 'failed') return Promise.reject(identityError.value ?? new Error('Identity could not be loaded.'))

  const requestRevision = revision
  const requestToken = {}
  const request = (async () => {
    try {
      const response = await rpc.me.$get()
      if (response.status === 401) {
        if (requestRevision === revision) setAnonymous()
        return null
      }

      const payload = await parseHonoResponse<typeof rpc.me.$get>(response)
      if (requestRevision !== revision) return identity.value

      identity.value = payload.data
      identityStatus.value = 'authenticated'
      identityError.value = undefined
      permissions().build(payload.data.permissions)
      return payload.data
    } catch (error) {
      if (requestRevision === revision) {
        identity.value = null
        identityStatus.value = 'failed'
        identityError.value = error
        permissions().clear()
      }
      throw error
    } finally {
      if (pendingToken === requestToken) {
        pending = undefined
        pendingToken = undefined
      }
    }
  })()
  pending = request
  pendingToken = requestToken
  return request
}

export function refreshIdentity(): Promise<OrgIdentity | null> {
  revision += 1
  pending = undefined
  pendingToken = undefined
  identity.value = null
  identityStatus.value = 'unknown'
  identityError.value = undefined
  permissions().clear()
  return loadIdentity()
}

export function clearIdentity(): void {
  revision += 1
  pending = undefined
  pendingToken = undefined
  setAnonymous()
}
