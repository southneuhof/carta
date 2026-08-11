import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  replace: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { roleId: 'role-1' } }),
  useRouter: () => ({ replace: mocks.replace }),
}))
vi.mock('vue-sonner', () => ({ toast: mocks.toast }))
vi.mock('@southneuhof/is-vue-framework', () => ({
  DetailView: {
    setup(_props: unknown, context: { slots: { controls?: () => unknown } }) {
      return () => context.slots.controls?.()
    },
  },
  useResourceRuntime: () => ({ adapters: { data: { normalizeError: () => ({ message: 'Request failed.' }) } } }),
}))
vi.mock('@/components/routing/AppRouterView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/routing/Tabs.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../roles.resource', () => ({
  roles: {
    capabilities: {
      list: { to: { name: 'settings-roles' } },
      update: { to: { name: 'settings-roles-edit', params: (id: string) => ({ roleId: id }) } },
    },
    delete: mocks.remove,
  },
}))
vi.mock('./detail/permissions/role-permissions.resource', () => ({
  rolePermissions: { capabilities: { list: { to: { name: 'settings-roles-detail-permissions' } } } },
}))

const Route = (await import('./detail.route.vue')).default

beforeEach(() => {
  vi.clearAllMocks()
  mocks.remove.mockResolvedValue({ ok: true })
})

afterEach(() => {
  mocks.remove.mockReset()
})

describe('role detail delete control', () => {
  it('deletes the role and returns to the role list', async () => {
    const wrapper = mount(Route, { global: { components: { Button: { template: '<button><slot /></button>' } } } })
    await wrapper.find('button[color="error"]').trigger('click')
    expect(mocks.remove).toHaveBeenCalledWith('role-1')
    expect(mocks.toast.success).toHaveBeenCalled()
    expect(mocks.replace).toHaveBeenCalledWith({ name: 'settings-roles' })
    wrapper.unmount()
  })

  it('shows both assignment counts and the deactivation instruction', async () => {
    mocks.remove.mockRejectedValue({ error: 'role_in_use', systemAssignmentCount: 2, projectAssignmentCount: 3 })
    const wrapper = mount(Route, { global: { components: { Button: { template: '<button><slot /></button>' } } } })
    await wrapper.find('button[color="error"]').trigger('click')
    expect(mocks.toast.error).toHaveBeenCalledWith(expect.stringContaining('System assignments: 2'))
    expect(mocks.toast.error).toHaveBeenCalledWith(expect.stringContaining('Project assignments: 3'))
    expect(mocks.toast.error).toHaveBeenCalledWith(expect.stringContaining('Deactivate the role'))
    expect(mocks.replace).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
