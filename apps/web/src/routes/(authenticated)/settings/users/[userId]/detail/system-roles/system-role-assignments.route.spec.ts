import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { FrameworkPlugin, createFrameworkQueryClient, resetResourceRuntimeForTests } from '@southneuhof/is-vue-framework'

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  set: vi.fn(),
  refreshIdentity: vi.fn(),
  toastError: vi.fn(),
  identity: { value: { user: { id: 'u1' } } },
}))

vi.mock('./system-role-assignments.actions', () => ({
  systemRoleAssignmentsActions: {
    list: ({ searchParameters }: { searchParameters: Record<string, unknown> }) => mocks.load(String(searchParameters.userId ?? '')),
    set: mocks.set,
  },
}))
vi.mock('@/framework/identity', () => ({ identity: mocks.identity, refreshIdentity: mocks.refreshIdentity }))
vi.mock('@/stores/permissions', () => ({ permissions: () => ({ has: () => true }) }))
vi.mock('vue-sonner', () => ({ toast: { error: mocks.toastError } }))

const SystemRolesRoute = (await import('./index.route.vue')).default

const catalogue = [
  { id: 'r1', roleCode: 'admin', name: 'Admin', description: 'Manage accounts', active: true, assigned: true },
  { id: 'r2', roleCode: 'legacy', name: 'Legacy', description: null, active: false, assigned: true },
  { id: 'r3', roleCode: 'auditor', name: 'Auditor', description: 'Read accounts', active: true, assigned: false },
]

async function flush(times = 8) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountRoute(userId = 'u1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings/users/:userId/detail/system-roles', name: 'settings-users-detail-system-roles', component: SystemRolesRoute }],
  })
  await router.push(`/settings/users/${userId}/detail/system-roles`)
  await router.isReady()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(SystemRolesRoute)))
  app.use(router)
  app.use(FrameworkPlugin, { queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }) })
  app.mount(host)
  await flush()

  return {
    host,
    switchRoot: (id: string) => host.querySelector<HTMLElement>(`[data-role="${id}"]`)!,
    switchButton: (id: string) => host.querySelector<HTMLButtonElement>(`[data-role="${id}"] button`)!,
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

beforeEach(() => {
  mocks.load.mockReset()
  mocks.set.mockReset()
  mocks.refreshIdentity.mockReset()
  mocks.load.mockResolvedValue({ data: catalogue.map((row) => ({ ...row })) })
  mocks.set.mockImplementation(async (_userId: string, roleId: string, assigned: boolean) => ({
    ...(catalogue.find((row) => row.id === roleId) ?? catalogue[0]),
    assigned,
  }))
  mocks.refreshIdentity.mockResolvedValue(mocks.identity.value)
  mocks.toastError.mockReset()
})

afterEach(() => {
  resetResourceRuntimeForTests()
})

describe('system role assignment screen', () => {
  it('shows many direct roles and the inactive assigned role for cleanup', async () => {
    const view = await mountRoute()

    expect(view.host.querySelectorAll('table')).toHaveLength(1)
    expect(view.host.textContent).toContain('Admin')
    expect(view.host.textContent).toContain('Legacy')
    expect(view.host.textContent).toContain('Auditor')
    expect(view.switchRoot('r1').getAttribute('role')).toBe('switch')
    expect(view.switchRoot('r1').getAttribute('aria-checked')).toBe('true')
    expect(view.switchRoot('r2').getAttribute('aria-checked')).toBe('true')
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('false')
    view.unmount()
  })

  it('adds a role for another user without refreshing the current identity', async () => {
    const view = await mountRoute('u2')

    view.switchButton('r3').click()
    await flush()
    expect(mocks.set).toHaveBeenCalledWith('u2', 'r3', true)
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('true')
    expect(mocks.refreshIdentity).not.toHaveBeenCalled()
    view.unmount()
  })

  it('removes a current-user role and refreshes the current identity', async () => {
    const view = await mountRoute('u1')

    view.switchButton('r1').click()
    await flush()
    expect(mocks.set).toHaveBeenCalledWith('u1', 'r1', false)
    expect(view.switchRoot('r1').getAttribute('aria-checked')).toBe('false')
    expect(mocks.refreshIdentity).toHaveBeenCalledOnce()
    view.unmount()
  })

  it('removes an inactive assigned role for cleanup', async () => {
    const view = await mountRoute('u2')

    view.switchButton('r2').click()
    await flush()
    expect(mocks.set).toHaveBeenCalledWith('u2', 'r2', false)
    expect(view.switchRoot('r2').getAttribute('aria-checked')).toBe('false')
    view.unmount()
  })

  it('keeps the prior switch state and disables only the pending row', async () => {
    let resolve: (value: typeof catalogue[number]) => void = () => undefined
    mocks.set.mockImplementationOnce(() => new Promise((promiseResolve) => { resolve = promiseResolve }))
    const view = await mountRoute()

    view.switchButton('r3').click()
    await nextTick()
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('false')
    expect(view.switchButton('r3').disabled).toBe(true)
    expect(view.switchButton('r1').disabled).toBe(false)

    resolve({ ...catalogue[2], assigned: true })
    await flush()
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('true')
    expect(view.switchButton('r3').disabled).toBe(false)
    view.unmount()
  })

  it('restores the row and shows a normalized error when the write fails', async () => {
    mocks.set.mockRejectedValueOnce({ message: 'Update denied.' })
    const view = await mountRoute()

    view.switchButton('r3').click()
    await flush()
    expect(view.switchRoot('r3').getAttribute('aria-checked')).toBe('false')
    expect(mocks.toastError).toHaveBeenCalledWith('Update denied.')
    view.unmount()
  })
})
