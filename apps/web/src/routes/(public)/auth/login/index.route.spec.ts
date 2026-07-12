import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), resolve: vi.fn() },
  signIn: vi.fn(),
  permissionsGet: vi.fn(),
  storageSet: vi.fn(),
  permissionsBuild: vi.fn(),
  modulesBuild: vi.fn(),
  consumeRedirect: vi.fn(),
  resolvePostLoginRoute: vi.fn(),
  globalLoadingDisable: vi.fn(),
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
  permissions: () => ({ build: mocks.permissionsBuild }),
}))

vi.mock('@/stores/modules', () => ({
  modules: () => ({ build: mocks.modulesBuild }),
}))

vi.mock('@/stores/loading', () => ({
  globalLoading: () => ({ disable: mocks.globalLoadingDisable }),
}))

vi.mock('@/utils/post-login-redirect', () => ({
  consumePostLoginRedirect: mocks.consumeRedirect,
}))

vi.mock('@/router/navigation', () => ({
  resolvePostLoginRoute: mocks.resolvePostLoginRoute,
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    api: { auth: { 'sign-in': { email: { $post: mocks.signIn } } } },
    roles: { ':roleId': { permissions: { $get: mocks.permissionsGet } } },
  },
}))

const visualStub = (name: string) => defineComponent({ name, template: '<div><slot /></div>' })
const inputStub = (name: string) => defineComponent({
  name,
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
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
        Button: visualStub('Button'),
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
    mocks.consumeRedirect.mockReturnValue('/settings/users')
    mocks.resolvePostLoginRoute.mockReturnValue({ name: 'users' })
  })

  it('sends credentials, persists assigned permissions, builds stores, and navigates once', async () => {
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
    expect(mocks.permissionsBuild).toHaveBeenCalledOnce()
    expect(mocks.modulesBuild).toHaveBeenCalledOnce()
    expect(mocks.resolvePostLoginRoute).toHaveBeenCalledWith(mocks.router, '/settings/users')
    expect(mocks.router.push).toHaveBeenCalledExactlyOnceWith({ name: 'users' })

    wrapper.unmount()
  })

  it('does not fetch permissions or navigate after a failed sign-in response', async () => {
    mocks.signIn.mockResolvedValue(response(false, { message: 'Invalid credentials' }))

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.permissionsGet).not.toHaveBeenCalled()
    expect(mocks.storageSet).not.toHaveBeenCalled()
    expect(mocks.router.push).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('does not navigate after a failed permission response', async () => {
    mocks.signIn.mockResolvedValue(response(true, { user: { id: 'user-1', roleId: 'role-1', name: 'Alice', email: 'alice@example.com' } }))
    mocks.permissionsGet.mockResolvedValue(response(false, { message: 'Permission lookup failed' }))

    const wrapper = mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mocks.permissionsGet).toHaveBeenCalledWith({ param: { roleId: 'role-1' } })
    expect(mocks.storageSet).not.toHaveBeenCalled()
    expect(mocks.router.push).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
