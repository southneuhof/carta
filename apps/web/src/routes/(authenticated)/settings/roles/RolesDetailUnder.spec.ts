import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  put: vi.fn().mockResolvedValue({ ok: true }),
  del: vi.fn().mockResolvedValue({ ok: true }),
  triggerChange: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    roles: {
      ':roleId': {
        permissions: {
          $get: vi.fn(),
          ':permissionId': { $put: mocks.put, $delete: mocks.del },
        },
      },
    },
  },
}))
vi.mock('@/stores/keyManager', () => ({ keyManager: () => ({ triggerChange: mocks.triggerChange }) }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: mocks.toastError } }))
vi.mock('@southneuhof/is-vue-framework/adapters/crud-operations', () => ({
  defineCRUDCompositeConfig: (config: unknown) => config,
}))

import RolesDetailUnder from './RolesDetailUnder.vue'

const SwitchStub = defineComponent({
  name: 'Switch',
  props: { onToggle: { type: Function, required: true }, disabled: { type: Boolean, default: false } },
  setup(_, { expose }) {
    expose()
    return () => h('button')
  },
})

function mountRoles(row: { id: string; active: boolean }) {
  const CRUDCompositeStub = defineComponent({
    name: 'CRUDComposite',
    setup(_, { slots }) {
      return () => h('div', slots['list-rowActions']?.({ data: row }))
    },
  })

  return shallowMount(RolesDetailUnder, {
    global: {
      provide: { data: ref({ id: 'role-7' }) },
      stubs: {
        CRUDComposite: CRUDCompositeStub,
        Switch: SwitchStub,
        DialogForm: true,
        Button: true,
        Icon: true,
      },
    },
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe('RolesDetailUnder permission toggles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses PUT with the role and permission IDs when enabling a permission', () => {
    const wrapper = mountRoles({ id: 'permission-3', active: false })
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => unknown

    onToggle(true)

    expect(mocks.put).toHaveBeenCalledExactlyOnceWith({ param: { roleId: 'role-7', permissionId: 'permission-3' } })
    expect(mocks.del).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('uses DELETE with the role and permission IDs when disabling a permission', () => {
    const wrapper = mountRoles({ id: 'permission-3', active: true })
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => unknown

    onToggle(false)

    expect(mocks.del).toHaveBeenCalledExactlyOnceWith({ param: { roleId: 'role-7', permissionId: 'permission-3' } })
    expect(mocks.put).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps the enabled value after a successful activation', async () => {
    const row = { id: 'permission-3', active: true }
    const wrapper = mountRoles(row)
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => Promise<void>

    await onToggle(true)

    expect(row.active).toBe(true)
    expect(wrapper.findComponent(SwitchStub).props('disabled')).toBe(false)
    wrapper.unmount()
  })

  it('keeps the disabled value after a successful deactivation', async () => {
    const row = { id: 'permission-3', active: false }
    const wrapper = mountRoles(row)
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => Promise<void>

    await onToggle(false)

    expect(row.active).toBe(false)
    expect(wrapper.findComponent(SwitchStub).props('disabled')).toBe(false)
    wrapper.unmount()
  })

  it('rolls back a rejected request and shows one error toast', async () => {
    const request = deferred<{ ok: boolean }>()
    mocks.del.mockReturnValueOnce(request.promise)
    const row = { id: 'permission-3', active: true }
    const wrapper = mountRoles(row)
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => Promise<void>
    row.active = false

    const pending = onToggle(false)
    await nextTick()
    expect(row.active).toBe(false)
    expect(wrapper.findComponent(SwitchStub).props('disabled')).toBe(true)
    request.reject(new Error('network failure'))
    await pending

    expect(row.active).toBe(true)
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith('Gagal memperbarui permission. Silakan coba lagi.')
    expect(wrapper.findComponent(SwitchStub).props('disabled')).toBe(false)
    wrapper.unmount()
  })

  it('treats a resolved non-OK RPC response as a failure', async () => {
    mocks.del.mockResolvedValueOnce({ ok: false, status: 500, json: vi.fn().mockResolvedValue({ message: 'failed' }) })
    const row = { id: 'permission-3', active: true }
    const wrapper = mountRoles(row)
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => Promise<void>
    row.active = false

    await onToggle(false)

    expect(row.active).toBe(true)
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith('Gagal memperbarui permission. Silakan coba lagi.')
    wrapper.unmount()
  })

  it('blocks a duplicate request for the same permission while pending', async () => {
    const request = deferred<{ ok: boolean }>()
    mocks.put.mockReturnValueOnce(request.promise)
    const row = { id: 'permission-3', active: true }
    const wrapper = mountRoles(row)
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => Promise<void>

    const first = onToggle(true)
    const second = onToggle(false)
    expect(mocks.put).toHaveBeenCalledTimes(1)
    request.resolve({ ok: true })
    await Promise.all([first, second])
    wrapper.unmount()
  })
})
