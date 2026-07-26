import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { FrameworkPlugin, createFrameworkQueryClient, resetResourceRuntimeForTests } from '@southneuhof/is-vue-framework'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })
const toggleCalls: { user_id: string; role_id: string; active: boolean }[] = []
let toggleFails = false
let assignedRoleId = 'r1'

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/utils/services', () => ({
  default: {
    post: vi.fn(async (_path: string, payload: { user_id: string; role_id: string; active: boolean }) => {
      toggleCalls.push(payload)
      if (toggleFails) throw new Error('Ditolak')
      assignedRoleId = payload.active ? payload.role_id : ''
      return {}
    }),
  },
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    users: {
      list: { $get: vi.fn(async () => ok({ data: [], total: 0 })) },
      detail: {
        ':id': {
          $get: vi.fn(async ({ param }: { param: { id: string } }) => ok({ data: { id: param.id, name: `Pengguna ${param.id}`, roleId: assignedRoleId } })),
        },
      },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
    },
    roles: {
      list: {
        $get: vi.fn(async () =>
          ok({
            data: [
              { id: 'r1', name: 'Admin' },
              { id: 'r2', name: 'Editor' },
            ],
            total: 2,
            limit: 100,
          })
        ),
      },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: {} })) } },
      create: { $post: vi.fn(async () => ok({ data: {} })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
      delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
    },
  },
}))

const RolesRoute = (await import('./index.route.vue')).default

async function flush(times = 10) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountRoute(userId = 'u1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings/users/:userId/roles', name: 'users-roles', component: RolesRoute }],
  })
  await router.push(`/settings/users/${userId}/roles`)
  await router.isReady()

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(RolesRoute)))
  app.use(router)
  app.use(FrameworkPlugin, { runtime: {}, queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }) })
  app.mount(host)
  await flush()

  return {
    host,
    router,
    row: (id: string) => host.querySelector<HTMLInputElement>(`[data-role="${id}"]`)!,
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

beforeEach(() => {
  toggleCalls.length = 0
  toggleFails = false
  assignedRoleId = 'r1'
})

afterEach(() => resetResourceRuntimeForTests())

describe('user role mapping screen', () => {
  it('marks the currently assigned role and leaves the others unmapped', async () => {
    const view = await mountRoute()

    expect(view.row('r1').checked).toBe(true)
    expect(view.row('r2').checked).toBe(false)
    view.unmount()
  })

  it('assigns a role optimistically and confirms with the mapping endpoint', async () => {
    const view = await mountRoute()

    view.row('r2').click()
    await nextTick()
    expect(view.row('r2').checked).toBe(true)

    await flush()
    expect(toggleCalls).toEqual([{ user_id: 'u1', role_id: 'r2', active: true }])
    view.unmount()
  })

  it('rolls back when the mapping call fails', async () => {
    toggleFails = true
    const view = await mountRoute()

    view.row('r2').click()
    await flush()

    expect(view.row('r2').checked).toBe(false)
    view.unmount()
  })

  it('ignores repeated toggles of one row while its request is in flight', async () => {
    const view = await mountRoute()

    view.row('r2').click()
    view.row('r2').click()
    await flush()

    expect(toggleCalls).toHaveLength(1)
    view.unmount()
  })

  it('reloads for a different user identity', async () => {
    const view = await mountRoute('u1')

    await view.router.push('/settings/users/u2/roles')
    await flush()

    expect(view.row('r1')).toBeTruthy()
    view.unmount()
  })

  it('refreshes the mapping from the server after a successful toggle', async () => {
    const view = await mountRoute()

    view.row('r2').click()
    await flush(16)

    expect(view.row('r2').checked).toBe(true)
    expect(view.row('r1').checked).toBe(false)
    view.unmount()
  })
})
