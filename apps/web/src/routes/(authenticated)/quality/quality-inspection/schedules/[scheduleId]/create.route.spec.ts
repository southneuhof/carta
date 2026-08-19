import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  loadScheduleContext: vi.fn(),
  create: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { scheduleId: 'schedule-1' } }) }))
vi.mock('@southneuhof/is-vue-framework', () => ({
  Detail: {
    props: ['fields', 'data'],
    template: '<div data-testid="detail"><span v-for="(field, key) in fields" :key="key">{{ field.label }}:{{ data[key] }}</span></div>',
  },
  FormView: {
    props: ['fields', 'initialData', 'description', 'title'],
    template: '<div data-testid="form-view"><h1>{{ title }}</h1><p>{{ description }}</p><p data-testid="form-fields">{{ fields.map((field) => field.key).join(",") }}</p><p data-testid="form-initial">{{ JSON.stringify(initialData) }}</p><slot name="input:selectedRows" :value="initialData.selectedRows" :set-value="() => undefined" /></div>',
  },
}))
vi.mock('@southneuhof/is-vue-framework/components/base', () => ({ Card: { template: '<section><slot /></section>' } }))
vi.mock('../../QualityInspectionWorkItemSelector.vue', () => ({ default: { template: '<div data-testid="selector" />' } }))
vi.mock('../../quality-inspection.actions', () => ({ loadScheduleContext: mocks.loadScheduleContext }))
vi.mock('../../quality-inspection.resource', () => ({
  qualityInspection: {
    create: mocks.create,
  },
}))

const Route = (await import('./create.route.vue')).default

beforeEach(() => {
  vi.clearAllMocks()
  mocks.create.mockReturnValue({
    fields: [{ key: 'divisionId' }, { key: 'projectId' }, { key: 'targetDate' }, { key: 'locationZone' }, { key: 'selectedRows' }],
    run: vi.fn(),
  })
  mocks.loadScheduleContext.mockResolvedValue({
    schedule: { id: 'schedule-1', workItemId: 'root-1', startDate: '2026-08-01', endDate: '2026-08-31' },
    project: { name: 'Project One' },
    context: {
      tree: [{ id: 'root-1', projectId: 'project-1', parentId: null, level: 0, code: 'ROOT', name: 'Root Work', categoryName: 'Category', volume: '10.00', uomName: 'm³', isHighRisk: false, isLeaf: true, itps: [], children: [] }],
    },
  })
})

afterEach(() => vi.restoreAllMocks())

describe('scheduled Quality Inspection origin', () => {
  it('shows the stored schedule origin and keeps origin fields out of the form', async () => {
    const wrapper = mount(Route)
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Asal Jadwal')
    expect(wrapper.text()).toContain('Project One')
    expect(wrapper.text()).toContain('Root Work')
    expect(wrapper.text()).toContain('Periode Mulai:2026-08-01')
    expect(wrapper.text()).toContain('Periode Selesai:2026-08-31')
    expect(wrapper.text()).toContain('Target Pelaksanaan dapat diubah.')
    expect(wrapper.get('[data-testid="form-fields"]').text()).toBe('targetDate,locationZone,selectedRows')
    expect(wrapper.get('[data-testid="form-initial"]').text()).toContain('"scheduleId":"schedule-1"')
    wrapper.unmount()
  })
})
