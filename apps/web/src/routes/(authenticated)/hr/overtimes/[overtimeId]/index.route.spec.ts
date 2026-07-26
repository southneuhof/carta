import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { FrameworkPlugin, createFrameworkQueryClient, resetResourceRuntimeForTests } from '@southneuhof/is-vue-framework'

const ok = (payload: unknown) => ({ ok: true, json: async () => payload })

type Step = { id: string; orderNumber: number; statusCode: string; jobPositionId: string | null; recipientEmployeeId: string | null }

let record = { id: 'o1', statusCode: 'draft', sectionId: 'sec-1', applicantEmployeeId: 'emp-1', date: '2026-07-20' }
let steps: Step[] = []
let identity: Record<string, unknown> | null = null

const submitPost = vi.fn(async () => ok({ data: record }))
const verifyPost = vi.fn(async () => ok({ data: record }))

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/framework/rpc', () => ({
  rpc: {
    me: { $get: vi.fn(async () => (identity ? ok({ data: identity }) : { ok: false, json: async () => ({}) })) },
    overtimes: {
      list: { $get: vi.fn(async () => ok({ data: [], total: 0, limit: 20 })) },
      detail: { ':id': { $get: vi.fn(async () => ok({ data: record })) } },
      create: { $post: vi.fn(async () => ok({ data: record })) },
      update: { ':id': { $patch: vi.fn(async () => ok({ data: record })) } },
      submit: { ':id': { $post: submitPost } },
      verify: { ':id': { $post: verifyPost } },
      steps: { ':id': { $get: vi.fn(async () => ok({ data: steps, total: steps.length })) } },
    },
  },
}))

const DetailRoute = (await import('./index.route.vue')).default
const { refreshOrgIdentity } = await import('@/framework/identity')

async function flush(times = 12) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountRoute() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/hr/overtimes/:overtimeId', name: 'overtime-detail', component: DetailRoute },
      { path: '/hr/overtimes', name: 'overtimes', component: { template: '<div />' } },
    ],
  })
  await router.push('/hr/overtimes/o1')
  await router.isReady()

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent(() => () => h(DetailRoute)))
  app.use(router)
  app.use(FrameworkPlugin, { runtime: {}, queryClient: createFrameworkQueryClient({ retry: 0, staleTime: 0 }) })
  app.mount(host)
  await flush()

  return {
    host,
    control: (key: string) => host.querySelector(`[data-control="${key}"], [data-testid="control-${key}"]`),
    text: () => host.textContent ?? '',
    unmount: () => {
      app.unmount()
      host.remove()
    },
  }
}

beforeEach(() => {
  record = { id: 'o1', statusCode: 'draft', sectionId: 'sec-1', applicantEmployeeId: 'emp-1', date: '2026-07-20' }
  steps = []
  identity = { userId: 'u1', employeeId: 'emp-1', sectionId: 'sec-1', jobPositionId: 'pos-1', roleIds: ['r1'], scope: 'section', permissions: [] }
  submitPost.mockClear()
  verifyPost.mockClear()
  refreshOrgIdentity()
})

afterEach(() => {
  resetResourceRuntimeForTests()
  vi.restoreAllMocks()
})

describe('overtime detail workflow controls', () => {
  it('offers Submit on a draft owned by the caller', async () => {
    const view = await mountRoute()

    expect(view.text()).toContain('Kirim Verifikasi')
    // Not yet in a chain, so there is nothing to decide.
    expect(view.text()).not.toContain('Setujui')
    view.unmount()
  })

  it('omits Submit entirely on someone else’s draft — absent, not disabled', async () => {
    identity = { ...identity, employeeId: 'emp-other' }
    const view = await mountRoute()

    expect(view.text()).not.toContain('Kirim Verifikasi')
    expect(view.host.querySelector('button[disabled]')).toBeNull()
    view.unmount()
  })

  it('omits Submit once the request is waiting', async () => {
    record = { ...record, statusCode: 'waiting' }
    steps = [{ id: 's1', orderNumber: 1, statusCode: 'waiting', jobPositionId: 'pos-verifier', recipientEmployeeId: null }]
    const view = await mountRoute()

    expect(view.text()).not.toContain('Kirim Verifikasi')
    view.unmount()
  })

  it('offers Setujui and Tolak to the holder of the step’s job position in the same section', async () => {
    record = { ...record, statusCode: 'waiting' }
    steps = [{ id: 's1', orderNumber: 1, statusCode: 'waiting', jobPositionId: 'pos-1', recipientEmployeeId: null }]
    const view = await mountRoute()

    expect(view.text()).toContain('Setujui')
    expect(view.text()).toContain('Tolak')
    view.unmount()
  })

  it('withholds them from the same job position in a different section', async () => {
    record = { ...record, statusCode: 'waiting', sectionId: 'sec-2' }
    steps = [{ id: 's1', orderNumber: 1, statusCode: 'waiting', jobPositionId: 'pos-1', recipientEmployeeId: null }]
    const view = await mountRoute()

    // The section clause is what stops one section verifying another's work.
    expect(view.text()).not.toContain('Setujui')
    view.unmount()
  })

  it('offers them to the step’s named recipient', async () => {
    record = { ...record, statusCode: 'waiting' }
    steps = [{ id: 's1', orderNumber: 1, statusCode: 'waiting', jobPositionId: null, recipientEmployeeId: 'emp-1' }]
    const view = await mountRoute()

    expect(view.text()).toContain('Setujui')
    view.unmount()
  })

  it('offers them to an all-scoped caller regardless of placement', async () => {
    record = { ...record, statusCode: 'waiting', sectionId: 'sec-9' }
    steps = [{ id: 's1', orderNumber: 1, statusCode: 'waiting', jobPositionId: 'pos-other', recipientEmployeeId: 'emp-other' }]
    identity = { ...identity, scope: 'all' }
    const view = await mountRoute()

    expect(view.text()).toContain('Setujui')
    view.unmount()
  })

  it('offers nothing on a decided request', async () => {
    record = { ...record, statusCode: 'approved' }
    steps = [{ id: 's1', orderNumber: 1, statusCode: 'approved', jobPositionId: 'pos-1', recipientEmployeeId: null }]
    const view = await mountRoute()

    expect(view.text()).not.toContain('Kirim Verifikasi')
    expect(view.text()).not.toContain('Setujui')
    view.unmount()
  })

  it('requires a reason before rejecting', async () => {
    record = { ...record, statusCode: 'waiting' }
    steps = [{ id: 's1', orderNumber: 1, statusCode: 'waiting', jobPositionId: 'pos-1', recipientEmployeeId: null }]
    const view = await mountRoute()

    const reject = [...view.host.querySelectorAll('button')].find((button) => button.textContent?.includes('Tolak'))
    reject?.click()
    await flush()

    const confirm = view.host.querySelector<HTMLButtonElement>('[data-confirm-reject]')
    expect(confirm).toBeTruthy()
    confirm!.click()
    await flush()

    // Empty reason: nothing is sent.
    expect(verifyPost).not.toHaveBeenCalled()

    const reason = view.host.querySelector<HTMLTextAreaElement>('[data-rejection-reason]')!
    reason.value = 'Tidak sesuai'
    reason.dispatchEvent(new Event('input'))
    await flush()
    view.host.querySelector<HTMLButtonElement>('[data-confirm-reject]')!.click()
    await flush()

    expect(verifyPost).toHaveBeenCalledWith({ param: { id: 'o1' }, json: { decision: 'rejected', description: 'Tidak sesuai' } })
    view.unmount()
  })
})
