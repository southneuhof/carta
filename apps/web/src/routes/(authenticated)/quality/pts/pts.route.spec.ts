import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  inputUpload: vi.fn(async () => ({ path: 'uploads/before.png' })),
  loadPtsLookups: vi.fn(),
  create: vi.fn(),
  detail: vi.fn(),
  submit: vi.fn(),
  replace: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  detailView: {
    setup(_props: unknown, context: { slots: { controls?: () => unknown } }) {
      return () => context.slots.controls?.()
    },
  },
}))

vi.mock('@/framework/adapters/upload', () => ({ inputUpload: mocks.inputUpload }))
vi.mock('@/framework/rpc', () => ({ rpc: {} }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { ptsId: 'pts-1' } }),
  useRouter: () => ({ replace: mocks.replace }),
}))
vi.mock('vue-sonner', () => ({ toast: mocks.toast }))
vi.mock('@southneuhof/is-vue-framework', () => ({
  DetailView: mocks.detailView,
  useResourceRuntime: () => ({ adapters: { data: { normalizeError: (error: unknown) => (error instanceof Error ? error : new Error('Request failed')) } } }),
}))
vi.mock('./pts.resource', () => ({ pts: { invalidate: mocks.invalidate } }))
vi.mock('./pts.operations', () => ({
  loadPtsLookups: mocks.loadPtsLookups,
  ptsOperations: { create: mocks.create, detail: mocks.detail },
  submitPtsAction: mocks.submit,
}))

const CreateRoute = (await import('./create.route.vue')).default
const DetailRoute = (await import('./[ptsId]/detail.route.vue')).default

const lookup = {
  divisions: [{ id: 'division-1', code: 'D1', name: 'Division 1' }],
  projects: [{ id: 'project-1', number: 'P1', name: 'Project 1', divisionId: 'division-1' }],
  workItems: [
    { id: 'category-1', code: 'C1', name: 'Category 1', projectId: 'project-1', parentId: null, active: true },
    { id: 'leaf-1', code: 'L1', name: 'Leaf 1', projectId: 'project-1', parentId: 'category-1', active: true },
  ],
  ptsWorkCategories: [{ id: 'pts-category-1', code: 'P1', name: 'PTS Category 1' }],
  rootCauses: [{ id: 'root-cause-1', code: 'R1', name: 'Root Cause 1' }],
  projectVendors: [{ id: 'vendor-1', projectId: 'project-1', name: 'Vendor 1' }],
}

async function flush() {
  await Promise.resolve()
  await nextTick()
}

beforeEach(() => {
  mocks.loadPtsLookups.mockResolvedValue(lookup)
  mocks.detail.mockResolvedValue({
    id: 'pts-1',
    stepCode: 'close',
    statusCode: 'open',
    availableActions: ['close'],
    activity: [{ id: 'activity-1', shortDescription: 'PTS report created.', createdAt: '2026-08-10' }],
  })
  mocks.inputUpload.mockResolvedValue({ path: 'uploads/before.png' })
  vi.clearAllMocks()
})

afterEach(() => {
  mocks.loadPtsLookups.mockResolvedValue(lookup)
})

describe('PTS create route', () => {
  it('loads scoped lookups and resets dependent selections', async () => {
    const wrapper = mount(CreateRoute)
    await flush()
    const selects = wrapper.findAll('select')

    await selects[0]!.setValue('division-1')
    await selects[1]!.setValue('project-1')
    await selects[3]!.setValue('category-1')
    await selects[4]!.setValue('leaf-1')
    await selects[0]!.setValue('')

    expect(mocks.loadPtsLookups).toHaveBeenCalledWith()
    expect((selects[1]!.element as HTMLSelectElement).value).toBe('')
    expect((selects[3]!.element as HTMLSelectElement).value).toBe('')
    expect((selects[4]!.element as HTMLSelectElement).value).toBe('')
    wrapper.unmount()
  })

  it('uploads a retained before image before enabling submit', async () => {
    const wrapper = mount(CreateRoute)
    await flush()
    const file = new File(['image'], 'before.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')

    expect(mocks.inputUpload).toHaveBeenCalledWith(file, {})
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('PTS detail route', () => {
  it('renders activity and reloads after an action', async () => {
    const wrapper = mount(DetailRoute)
    await flush()
    expect(wrapper.text()).toContain('PTS report created.')

    await wrapper.find('textarea').setValue('Closed')
    await wrapper.find('input[type="date"]').setValue('2026-08-20')
    await wrapper.find('form').trigger('submit')
    await flush()

    expect(mocks.submit).toHaveBeenCalledWith('pts-1', 'close', { closeNotes: 'Closed', closeDate: '2026-08-20' })
    expect(mocks.invalidate).toHaveBeenCalledOnce()
    expect(mocks.detail).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})
