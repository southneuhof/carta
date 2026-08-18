import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { FrameworkPlugin, createFrameworkQueryClient, resetResourceRuntimeForTests } from '@southneuhof/is-vue-framework'

const mocks = vi.hoisted(() => ({
  projectsList: vi.fn(),
  qualityInspectionsList: vi.fn(),
  schedulesList: vi.fn(),
}))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    projects: { list: { $get: mocks.projectsList } },
    'quality-inspection': {
      list: { $get: mocks.qualityInspectionsList },
      schedules: { list: { $get: mocks.schedulesList } },
    },
  },
}))

const Screen = (await import('./index.route.vue')).default

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

async function flush(times = 8) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountScreen() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'quality-quality-inspection', component: Screen },
      { path: '/create', name: 'quality-quality-inspection-create', component: { template: '<div />' } },
      { path: '/schedules', name: 'quality-quality-inspection-schedules', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(Screen)))
  app.use(router)
  app.use(FrameworkPlugin, { queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }) })
  app.mount(host)
  await flush()
  return { host, unmount: () => { app.unmount(); host.remove() } }
}

function hasButton(host: HTMLElement, label: string) {
  return Array.from(host.querySelectorAll('button')).some((button) => button.textContent?.includes(label))
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.qualityInspectionsList.mockResolvedValue(ok({ data: [], total: 0 }))
  mocks.schedulesList.mockResolvedValue(ok({ data: [] }))
})

afterEach(() => resetResourceRuntimeForTests())

describe('Inspection/Test entry controls', () => {
  it('shows manual and scheduled entries when the owner list returns a permitted project', async () => {
    mocks.projectsList.mockResolvedValue(ok({ data: [{ id: 'project-1', name: 'Project' }], total: 1 }))
    const view = await mountScreen()

    expect(hasButton(view.host, 'Buat Inspection/Test')).toBe(true)
    expect(hasButton(view.host, 'Jadwal Inspection/Test')).toBe(true)
    expect(mocks.projectsList).toHaveBeenCalledWith(
      { query: { permission: 'create-quality-inspection', active: 'true' } },
      expect.anything(),
    )
    view.unmount()
  })

  it('hides both creation entries when the owner list is empty', async () => {
    mocks.projectsList.mockResolvedValue(ok({ data: [], total: 0 }))
    const view = await mountScreen()

    expect(hasButton(view.host, 'Buat Inspection/Test')).toBe(false)
    expect(hasButton(view.host, 'Jadwal Inspection/Test')).toBe(false)
    view.unmount()
  })
})
