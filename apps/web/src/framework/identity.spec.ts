import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  meGet: vi.fn(),
  build: vi.fn(),
  clear: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({ rpc: { me: { $get: mocks.meGet } } }))
vi.mock('@/stores/permissions', () => ({ permissions: () => ({ build: mocks.build, clear: mocks.clear }) }))

import { clearIdentity, identity, identityStatus, loadIdentity, refreshIdentity } from './identity'

function response(status = 200, payload: unknown = { data: { userId: 'user-1', user: { id: 'user-1' }, roleCodes: [], permissions: ['view-users'] } }) {
  return { status, ok: status >= 200 && status < 300, json: vi.fn().mockResolvedValue(payload) }
}

describe('browser identity', () => {
  beforeEach(() => {
    mocks.meGet.mockReset()
    mocks.build.mockReset()
    mocks.clear.mockReset()
  })

  afterEach(() => clearIdentity())

  it('starts in the unknown state without storage access', () => {
    expect(identityStatus.value).toBe('unknown')
    expect(identity.value).toBeNull()
  })

  it('shares one in-flight /me request and builds memory permissions', async () => {
    let resolve: (value: ReturnType<typeof response>) => void = () => undefined
    mocks.meGet.mockReturnValue(
      new Promise((promiseResolve) => {
        resolve = promiseResolve
      })
    )

    const first = refreshIdentity()
    const second = loadIdentity()
    expect(mocks.meGet).toHaveBeenCalledOnce()

    resolve(response())
    await expect(first).resolves.toMatchObject({ userId: 'user-1' })
    await expect(second).resolves.toMatchObject({ userId: 'user-1' })
    expect(identityStatus.value).toBe('authenticated')
    expect(mocks.build).toHaveBeenCalledWith(['view-users'])
  })

  it('refreshes identity and replaces the permission set', async () => {
    mocks.meGet.mockResolvedValueOnce(response()).mockResolvedValueOnce(response(200, { data: { userId: 'user-2', user: { id: 'user-2' }, roleCodes: [], permissions: ['create-users'] } }))

    await refreshIdentity()
    const refreshed = await refreshIdentity()

    expect(refreshed?.userId).toBe('user-2')
    expect(mocks.meGet).toHaveBeenCalledTimes(2)
    expect(mocks.build).toHaveBeenLastCalledWith(['create-users'])
  })

  it('builds memory permissions from the effective /me union', async () => {
    mocks.meGet.mockResolvedValue(response(200, { data: { userId: 'user-3', user: { id: 'user-3' }, roleCodes: [], permissions: ['view-users', 'create-rtm'] } }))

    await refreshIdentity()

    expect(mocks.build).toHaveBeenCalledWith(['view-users', 'create-rtm'])
  })

  it('clears identity and permissions on logout', async () => {
    mocks.meGet.mockResolvedValue(response())
    await refreshIdentity()

    clearIdentity()

    expect(identity.value).toBeNull()
    expect(identityStatus.value).toBe('anonymous')
    expect(mocks.clear).toHaveBeenCalled()
  })

  it('maps a 401 to anonymous without marking the load failed', async () => {
    mocks.meGet.mockResolvedValue(response(401, { error: 'unauthorized' }))

    await expect(refreshIdentity()).resolves.toBeNull()

    expect(identityStatus.value).toBe('anonymous')
    expect(mocks.clear).toHaveBeenCalled()
  })

  it('keeps non-401 failures distinct from anonymous state', async () => {
    const error = new Error('network failure')
    mocks.meGet.mockRejectedValue(error)

    await expect(refreshIdentity()).rejects.toBe(error)

    expect(identityStatus.value).toBe('failed')
    expect(identity.value).toBeNull()
    await expect(loadIdentity()).rejects.toBe(error)
    expect(mocks.meGet).toHaveBeenCalledOnce()
  })
})
