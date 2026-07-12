import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), resolve: vi.fn() },
  signIn: vi.fn(),
  permissionsGet: vi.fn(),
  signOut: vi.fn(),
  storageSet: vi.fn(),
  permissionsBuild: vi.fn(),
  permissionsClear: vi.fn(),
  consumeRedirect: vi.fn(),
  resolvePostLoginRoute: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => mocks.router,
}))

vi.mock('@southneuhof/utilities/storage', () => ({
  storage: { localStorage: { get: vi.fn(), set: mocks.storageSet } },
}))

vi.mock('@/assets/corporate/common/Logo.vue', () => ({ default: { name: 'Logo' } }))
vi.mock('@southneuhof/is-vue-framework/components/base/Card.vue', () => ({ default: { name: 'Card' } }))
vi.mock('@southneuhof/is-vue-framework/components/base/Toast.vue', () => ({ default: { name: 'Toast' } }))
vi.mock('@southneuhof/is-vue-framework/components/base/Button.vue', () => ({ default: { name: 'Button' } }))
vi.mock('@southneuhof/is-vue-framework/components/base/Spinner.vue', () => ({ default: { name: 'Spinner' } }))
vi.mock('@southneuhof/is-vue-framework/components/inputs/TextInput.vue', () => ({ default: { name: 'TextInput' } }))
vi.mock('@southneuhof/is-vue-framework/components/inputs/PasswordInput.vue', () => ({ default: { name: 'PasswordInput' } }))

vi.mock('@/stores/permissions', () => ({
  permissions: () => ({ build: mocks.permissionsBuild, clear: mocks.permissionsClear }),
}))

vi.mock('@/utils/post-login-redirect', () => ({
  consumePostLoginRedirect: mocks.consumeRedirect,
}))

vi.mock('@/router/navigation', () => ({
  resolvePostLoginRoute: mocks.resolvePostLoginRoute,
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    roles: { ':roleId': { permissions: { $get: mocks.permissionsGet } } },
    api: { auth: { 'sign-in': { email: { $post: mocks.signIn } }, 'sign-out': { $post: mocks.signOut } } },
  },
}))

const visualStub = (name: string) => defineComponent({ name, template: '<div><slot /></div>' })
const inputStub = (name: string) => defineComponent({
  name,
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
})
const buttonStub = defineComponent({
  name: 'Button',
  props: { disabled: { type: Boolean, default: false } },
  template: '<button :disabled="disabled"><slot /></button>',
})

import Login from './index.route.vue'

function response(ok: boolean, payload: unknown) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  }
}

function mountLogin() {
  return mount(Login, {
    global: {
      stubs: {
        Logo: visualStub('Logo'),
        Card: visualStub('Card'),
        Toast: visualStub('Toast'),
        Button: buttonStub,
        Spinner: visualStub('Spinner'),
        TextInput: inputStub('TextInput'),
        PasswordInput: inputStub('PasswordInput'),
      },
    },
  })
}

describe('login route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.signOut.mockResolvedValue(undefined)
    mocks.consumeRedirect.mockReturnValue('/settings/users')
    mocks.resolvePostLoginRoute.mockReturnValue({ name: 'users' })
  })

  it('sends credentials, persists assigned permissions, and navigates once', async () => {
    mocks.signIn.mockResolvedValue(response(true, { user: { id: 'user-1', roleId: 'role-1', name: 'Alice', email: 'alice@example.com' } }))
    mocks.permissionsGet.mockResolvedValue(response(true, {
      data: [
        { id: 'view-users', assigned: true },
        { id: 'view-admin', assigned: false },
      ],
    }))

    const wrapper = mountLogin()
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('alice@example.com')
    await inputs[1]!.setValue('secret')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.signIn).toHaveBeenCalledWith({ json: { email: 'alice@example.com', password: 'secret' } })
    expect(mocks.permissionsGet).toHaveBeenCalledWith({ param: { roleId: 'role-1' } })
    expect(mocks.storageSet).toHaveBeenCalledWith('profile', {
      id: 'user-1',
      roleId: 'role-1',
      name: 'Alice',
      email: 'alice@example.com',
      role_id: 'role-1',
      fullname: 'Alice',
      username: 'alice@example.com',
    })
    expect(mocks.storageSet).toHaveBeenCalledWith('permissions', ['view-users'])
    expect(mocks.permissionsBuild).toHaveBeenCalledExactlyOnceWith(['view-users'])
    expect(mocks.resolvePostLoginRoute).toHaveBeenCalledWith(mocks.router, '/settings/users')
    expect(mocks.router.push).toHaveBeenCalledExactlyOnceWith({ name: 'users' })
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('shows a controlled credential error and leaves state untouched after a failed sign-in response', async () => {
    mocks.signIn.mockResolvedValue(response(false, { message: 'Invalid credentials' }))

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.permissionsGet).not.toHaveBeenCalled()
    expect(mocks.storageSet).not.toHaveBeenCalled()
    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Email atau password tidak valid')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('shows a controlled permission error and cleans up after a failed permission response', async () => {
    mocks.signIn.mockResolvedValue(response(true, { user: { id: 'user-1', roleId: 'role-1', name: 'Alice', email: 'alice@example.com' } }))
    mocks.permissionsGet.mockResolvedValue(response(false, { message: 'Permission lookup failed' }))

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.permissionsGet).toHaveBeenCalledWith({ param: { roleId: 'role-1' } })
    expect(mocks.storageSet).not.toHaveBeenCalled()
    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Gagal memuat akses aplikasi. Silakan coba lagi')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('shows a controlled connection error when sign-in cannot reach the server', async () => {
    mocks.signIn.mockRejectedValue(new Error('network details must stay hidden'))

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.storageSet).not.toHaveBeenCalled()
    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Tidak dapat terhubung ke server. Silakan coba lagi')
    expect(wrapper.text()).not.toContain('network details must stay hidden')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('rejects accounts with no assigned permissions without persisting or navigating', async () => {
    mocks.signIn.mockResolvedValue(response(true, { user: { id: 'user-1', roleId: 'role-1', name: 'Alice', email: 'alice@example.com' } }))
    mocks.permissionsGet.mockResolvedValue(response(true, { data: [] }))

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.storageSet).not.toHaveBeenCalled()
    expect(mocks.permissionsBuild).not.toHaveBeenCalled()
    expect(mocks.permissionsClear).toHaveBeenCalledOnce()
    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Anda tidak memiliki akses ke aplikasi ini')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('rejects a missing destination without persisting or navigating', async () => {
    mocks.signIn.mockResolvedValue(response(true, { user: { id: 'user-1', roleId: 'role-1', name: 'Alice', email: 'alice@example.com' } }))
    mocks.permissionsGet.mockResolvedValue(response(true, { data: [{ id: 'view-users', assigned: true }] }))
    mocks.resolvePostLoginRoute.mockReturnValue(null)

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.permissionsBuild).toHaveBeenCalledExactlyOnceWith(['view-users'])
    expect(mocks.storageSet).not.toHaveBeenCalled()
    expect(mocks.permissionsClear).toHaveBeenCalledOnce()
    expect(mocks.router.push).not.toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Tidak ada halaman yang dapat diakses oleh akun ini')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('keeps the primary error when session cleanup fails', async () => {
    mocks.signIn.mockResolvedValue(response(true, { user: { id: 'user-1', roleId: 'role-1', name: 'Alice', email: 'alice@example.com' } }))
    mocks.permissionsGet.mockResolvedValue(response(true, { data: [] }))
    mocks.signOut.mockRejectedValue(new Error('cleanup details must stay hidden'))

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.signOut).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Anda tidak memiliki akses ke aplikasi ini')
    expect(wrapper.text()).not.toContain('cleanup details must stay hidden')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })
})
