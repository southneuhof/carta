import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn().mockResolvedValue({ ok: true }),
  route: { query: {} },
  toastError: vi.fn(),
}))

vi.mock('@/utils/services', () => ({ default: mocks }))
vi.mock('vue-router', () => ({ useRoute: () => mocks.route }))
vi.mock('vue-sonner', () => ({ toast: { error: mocks.toastError } }))
vi.mock('@southneuhof/is-vue-framework/adapters/crud-operations', () => ({
  defineCRUDCompositeConfig: (config: unknown) => config,
}))

import UsersMappingRole from './UsersMappingRole.vue'

const SwitchStub = defineComponent({
  name: 'Switch',
  props: { onToggle: { type: Function, required: true }, disabled: { type: Boolean, default: false } },
  setup() {
    return () => h('button')
  },
})

function mountUserRoles(row: { id: string; active: boolean }) {
  const CRUDCompositeStub = defineComponent({
    name: 'CRUDComposite',
    setup(_, { slots }) {
      return () => h('div', slots['list-rowActions']?.({ data: row }))
    },
  })

  return shallowMount(UsersMappingRole, {
    global: {
      provide: { data: ref({ id: 42 }) },
      stubs: {
        CRUDComposite: CRUDCompositeStub,
        Switch: SwitchStub,
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

describe('UsersMappingRole toggles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts the resolved user, role, and next active value', () => {
    const wrapper = mountUserRoles({ id: '7', active: false })
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => unknown

    onToggle(true)

    expect(mocks.post).toHaveBeenCalledExactlyOnceWith('mapping-user-roles/toggle', {
      user_id: 42,
      role_id: '7',
      active: true,
    })
    wrapper.unmount()
  })

  it('rolls back a rejected request and shows one error toast', async () => {
    const request = deferred<unknown>()
    mocks.post.mockReturnValueOnce(request.promise)
    const row = { id: '7', active: true }
    const wrapper = mountUserRoles(row)
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => Promise<void>
    row.active = false

    const pending = onToggle(false)
    await nextTick()
    expect(row.active).toBe(false)
    expect(wrapper.findComponent(SwitchStub).props('disabled')).toBe(true)
    request.reject(new Error('network failure'))
    await pending

    expect(row.active).toBe(true)
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith('Gagal memperbarui role pengguna. Silakan coba lagi.')
    expect(wrapper.findComponent(SwitchStub).props('disabled')).toBe(false)
    wrapper.unmount()
  })

  it('blocks a duplicate request for the same role while pending', async () => {
    const request = deferred<unknown>()
    mocks.post.mockReturnValueOnce(request.promise)
    const row = { id: '7', active: false }
    const wrapper = mountUserRoles(row)
    const onToggle = wrapper.findComponent(SwitchStub).props('onToggle') as (nextValue: boolean) => Promise<void>

    const first = onToggle(true)
    const second = onToggle(false)
    expect(mocks.post).toHaveBeenCalledTimes(1)
    request.resolve({ ok: true })
    await Promise.all([first, second])
    wrapper.unmount()
  })
})
