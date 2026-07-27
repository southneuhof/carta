import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { FrameworkPlugin, createFrameworkQueryClient, resetResourceRuntimeForTests } from '@southneuhof/is-vue-framework'

const listResponses: unknown[] = []
const permissionCalls: { method: string; roleId: string; permissionId: string }[] = []
let toggleFails = false

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/framework/rpc', () => {
  const permissionRoute = {
    ':permissionId': {
      $put: vi.fn(async ({ param }: { param: { roleId: string; permissionId: string } }) => {
        permissionCalls.push({ method: 'put', ...param })
        return toggleFails ? { ok: false, json: async () => ({ message: 'Ditolak' }) } : ok({ data: {} })
      }),
      $delete: vi.fn(async ({ param }: { param: { roleId: string; permissionId: string } }) => {
        permissionCalls.push({ method: 'delete', ...param })
        return toggleFails ? { ok: false, json: async () => ({ message: 'Ditolak' }) } : ok({ data: {} })
      }),
    },
    $get: vi.fn(async ({ param }: { param: { roleId: string } }) => {
      const response = listResponses.shift() ?? {
        data: [
          { id: 'p1', name: `Lihat ${param.roleId}`, assigned: false },
          { id: 'p2', name: 'Ubah', assigned: true },
        ],
        total: 2,
      }
      return ok(response)
    }),
  }

  return {
    rpc: {
      roles: {
        ':roleId': { permissions: permissionRoute },
        list: { $get: vi.fn(async () => ok({ data: [], total: 0 })) },
        detail: { ':id': { $get: vi.fn(async () => ok({ data: {} })) } },
        create: { $post: vi.fn(async () => ok({ data: {} })) },
        update: { ':id': { $patch: vi.fn(async () => ok({ data: {} })) } },
        delete: { ':id': { $delete: vi.fn(async () => ok({ ok: true })) } },
      },
    },
  }
})

const PermissionsRoute = (await import('./index.route.vue')).default
const { rolePermissions } = await import('@/framework/adapters/resources/roles')

async function flush(times = 8) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountRoute(roleId = 'role-1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings/roles/:roleId/permissions', name: 'roles-permissions', component: PermissionsRoute }],
  })
  await router.push(`/settings/roles/${roleId}/permissions`)
  await router.isReady()

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(PermissionsRoute)))
  app.use(router)
  app.use(FrameworkPlugin, { runtime: {}, queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }) })
  app.mount(host)
  await flush()

  return {
    host,
    router,
    checkbox: (id: string) => host.querySelector<HTMLInputElement>(`[data-permission="${id}"]`)!,
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

beforeEach(() => {
  permissionCalls.length = 0
  listResponses.length = 0
  toggleFails = false
})

afterEach(() => resetResourceRuntimeForTests())

describe('role permissions screen', () => {
  it('loads permissions scoped by the role from the route params', async () => {
    const view = await mountRoute('role-9')

    expect(view.host.textContent).toContain('Lihat role-9')
    expect(view.checkbox('p2').checked).toBe(true)
    expect(view.checkbox('p1').checked).toBe(false)
    view.unmount()
  })

  it('assigns a permission optimistically and confirms with the backend', async () => {
    const view = await mountRoute()

    view.checkbox('p1').click()
    await nextTick()
    expect(view.checkbox('p1').checked).toBe(true)

    await flush()
    expect(permissionCalls).toEqual([{ method: 'put', roleId: 'role-1', permissionId: 'p1' }])
    view.unmount()
  })

  it('removes a permission through the delete endpoint', async () => {
    const view = await mountRoute()

    view.checkbox('p2').click()
    await flush()

    expect(permissionCalls).toEqual([{ method: 'delete', roleId: 'role-1', permissionId: 'p2' }])
    view.unmount()
  })

  it('rolls the row back when the request fails', async () => {
    toggleFails = true
    const view = await mountRoute()

    view.checkbox('p1').click()
    await flush()

    expect(view.checkbox('p1').checked).toBe(false)
    view.unmount()
  })

  it('ignores repeated toggles of a row while its request is in flight', async () => {
    const view = await mountRoute()

    view.checkbox('p1').click()
    view.checkbox('p1').click()
    view.checkbox('p1').click()
    await flush()

    expect(permissionCalls).toHaveLength(1)
    view.unmount()
  })

  it('reloads when the role identity changes', async () => {
    const view = await mountRoute('role-1')
    expect(view.host.textContent).toContain('Lihat role-1')

    await view.router.push('/settings/roles/role-2/permissions')
    await flush()

    expect(view.host.textContent).toContain('Lihat role-2')
    view.unmount()
  })

  it('refreshes the collection after a successful toggle', async () => {
    const view = await mountRoute()
    listResponses.push({ data: [{ id: 'p1', name: 'Lihat', assigned: true }], total: 1 })

    view.checkbox('p1').click()
    await flush(12)

    await rolePermissions.invalidate()
    await flush()
    expect(view.host.querySelectorAll('[data-permission]').length).toBeGreaterThan(0)
    view.unmount()
  })
})
