import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'

const mocks = vi.hoisted(() => ({
  record: null as Record<string, unknown> | null,
  invalidate: vi.fn(),
  refresh: vi.fn(),
  loadTemplate: vi.fn(),
  completeReport: vi.fn(),
  verifyWorkItem: vi.fn(),
  submitDocumentations: vi.fn(),
  verifyReport: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('vue-router', () => ({
  RouterLink: { name: 'RouterLink', props: ['to'], template: '<a v-bind="$attrs"><slot /></a>' },
  useRoute: () => ({ params: { qualityInspectionId: 'qi-1' } }),
}))
vi.mock('vue-sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }))
vi.mock('@southneuhof/is-vue-framework', () => ({
  DetailView: {
    props: ['detail'],
    methods: {
      value(field: Record<string, any>, data: Record<string, any>) {
        return typeof field.read === 'function' ? field.read(data, {}) : data?.[field.key]
      },
    },
    template:
      '<div data-testid="detail-view"><slot name="controls" /><div v-for="field in detail.fields" :key="field.key"><span>{{ field.label }}:</span><slot v-if="field.key === \'statusCode\'" name="value:statusCode" :value="value(field, detail.data)" /><slot v-else-if="field.key === \'resultCode\'" name="value:resultCode" :value="value(field, detail.data)" /><span v-else>{{ value(field, detail.data) ?? \'—\' }}</span></div></div>',
  },
  Detail: {
    props: ['fields', 'data'],
    methods: {
      entries(fields: unknown) {
        return Array.isArray(fields) ? fields : Object.entries(fields ?? {}).map(([key, field]) => ({ key, ...(field as Record<string, any>) }))
      },
      value(field: Record<string, any>, data: Record<string, any>) {
        return typeof field.read === 'function' ? field.read(data, {}) : data?.[field.key]
      },
    },
    template: '<div data-testid="detail-values"><span v-for="field in entries(fields)" :key="field.key">{{ field.label }}:{{ value(field, data) ?? \'—\' }}</span></div>',
  },
  DialogForm: {
    name: 'DialogForm',
    props: ['open', 'fields', 'submit', 'description', 'title', 'disabled'],
    template: '<div v-if="open" data-testid="dialog-form">{{ title }}</div>',
  },
  Table: {
    props: ['data', 'fields'],
    methods: {
      entries(fields: unknown) {
        return Array.isArray(fields) ? fields : Object.entries(fields ?? {}).map(([key, field]) => ({ key, ...(field as Record<string, any>) }))
      },
      value(field: Record<string, any>, data: Record<string, any>) {
        return typeof field.read === 'function' ? field.read(data, {}) : data?.[field.key]
      },
    },
    template:
      '<div data-testid="table"><div v-for="row in data || []" :key="row.row?.id || row.id"><span v-for="field in entries(fields)" :key="field.key"><span>{{ field.label }}:</span><slot :name="`cell:${field.key}`" :value="value(field, row)" :record="row">{{ Array.isArray(value(field, row)) ? value(field, row).join(",") : value(field, row) }}</slot></span><slot name="row-actions" :record="row" /></div></div>',
  },
  useLoader: () => ({ data: ref(mocks.record), refresh: mocks.refresh }),
  recordKey: () => 'quality-inspection-detail',
}))
vi.mock('@southneuhof/is-vue-framework/components/base', () => ({
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<section v-bind="$attrs"><slot /></section>' },
  Icon: { template: '<span />' },
  Chip: { template: '<span data-testid="chip"><slot /></span>' },
  Timeline: {
    props: ['data'],
    template:
      '<div data-testid="timeline"><div v-for="item in data" :key="item.id"><slot name="node" :data="item" /><slot name="header" :data="item" /><slot name="content" :data="item" /></div></div>',
  },
  ImagePreview: { props: ['imageURL'], template: '<img data-testid="image-preview" :src="imageURL" />' },
}))
vi.mock('../quality-inspection.resource', () => ({
  qualityInspectionFields: {
    number: { key: 'number', label: 'Nomor' },
    divisionId: { key: 'divisionId', label: 'Divisi' },
    projectId: { key: 'projectId', label: 'Proyek' },
    targetDate: { key: 'targetDate', label: 'Target Pelaksanaan' },
    qualityWorkCategoryId: { key: 'qualityWorkCategoryId', label: 'Kategori Pekerjaan' },
    workItemCategoryId: { key: 'workItemCategoryId', label: 'Jenis Pekerjaan' },
    locationZone: { key: 'locationZone', label: 'Area/Zona Kerja' },
    createdByName: { key: 'createdByName', label: 'Dilaporkan Oleh', read: (record: Record<string, any>) => record.createdByUser?.name ?? record.createdByName },
    scheduleId: { key: 'scheduleId', label: 'Jadwal' },
    scheduleStartDate: { key: 'scheduleStartDate', label: 'Periode Mulai' },
    scheduleEndDate: { key: 'scheduleEndDate', label: 'Periode Selesai' },
    statusCode: { key: 'statusCode', label: 'Status' },
    stepCode: { key: 'stepCode', label: 'Tahap' },
    resultCode: { key: 'resultCode', label: 'Hasil Inspeksi' },
    verificationDescription: { key: 'verificationDescription', label: 'Catatan' },
    inspectionPointCode: { key: 'inspectionPointCode', label: 'Inspection Point' },
    workMethod: { key: 'workMethod', label: 'Prosedur / Metode Kerja' },
  },
  qualityInspection: {
    detail: () => ({ namespace: 'quality-inspection', id: 'qi-1', searchParameters: {}, run: vi.fn() }),
    invalidate: mocks.invalidate,
  },
}))
vi.mock('../quality-inspection.actions', () => ({
  completeReport: mocks.completeReport,
  verifyWorkItem: mocks.verifyWorkItem,
  submitDocumentations: mocks.submitDocumentations,
  verifyReport: mocks.verifyReport,
  qualityInspectionActions: {
    completeReport: mocks.completeReport,
    verifyWorkItem: mocks.verifyWorkItem,
    submitDocumentations: mocks.submitDocumentations,
    verifyReport: mocks.verifyReport,
  },
}))
vi.mock('../../inspection-test-plans/itp.actions', () => ({
  itpActions: { loadTemplate: mocks.loadTemplate },
}))
vi.mock('../quality-inspection.schema', () => ({
  acceptanceCriteriaLabels: {
    material: 'Kriteria/Tolok Ukur Penerimaan (Material)',
    process: 'Kriteria/Tolok Ukur Penerimaan (Proses)',
    product: 'Kriteria/Tolok Ukur Penerimaan (Product)',
  },
  itpTypeLabels: { material: 'Material', process: 'Proses', product: 'Product' },
  resultColors: { approved: 'success', rejected: 'error', repair: 'warning', pending: 'warning' },
  resultLabels: { approved: 'Diterima', rejected: 'Ditolak', repair: 'Diperbaiki', pending: 'Ditunda' },
  resultOptions: [
    { id: 'approved', name: 'Diterima' },
    { id: 'rejected', name: 'Ditolak' },
    { id: 'repair', name: 'Diperbaiki' },
    { id: 'pending', name: 'Ditunda' },
  ],
  statusColors: { open: 'info', 'on-progress': 'warning', close: 'success' },
  statusLabels: { open: 'Open', 'on-progress': 'On Progress', close: 'Closed' },
  statusOptions: [{ id: 'open', name: 'Open' }],
  stepLabels: { report: 'Dilaporkan' },
}))
vi.mock('../../pts/pts.schema', () => ({
  codeLabel: (value: unknown, labels: Record<string, string> = {}) => labels[String(value)] ?? String(value ?? '—'),
  stepLabels: { 'qi-report': 'Inspection/Test report' },
}))
vi.mock('../QualityInspectionDocumentationForm.vue', () => ({
  default: { name: 'QualityInspectionDocumentationForm', props: ['initial', 'submit', 'submitLabel'], template: '<div data-testid="documentation-form">{{ submitLabel }}</div>' },
}))
vi.mock('../QualityInspectionEvidenceExport.vue', () => ({ default: { template: '<div />' } }))

const Route = (await import('./detail.route.vue')).default

function record(schedule: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'qi-1',
    number: 'QI-001',
    divisionId: 'division-1',
    projectId: 'project-1',
    targetDate: '2026-08-20',
    qualityWorkCategoryId: 'category-1',
    workItemCategoryId: 'root-1',
    locationZone: 'Zone A',
    createdByUser: { id: 'user-1', name: 'Inspector One' },
    statusCode: 'open',
    stepCode: 'report',
    resultCode: null,
    verificationDescription: null,
    allowedActions: [],
    workItems: [],
    documentations: [],
    verifications: [],
    ptsRejections: [],
    activity: [],
    ...schedule,
  }
}

function documentations() {
  return ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'].map((name) => ({
    name,
    fileAttachment: `uploads/${name.replace(' ', '-')}.jpg`,
    description: `Catatan ${name}`,
  }))
}

function snapshot(type: string, values: Partial<Record<string, unknown>> = {}) {
  return {
    id: `${type}-snapshot`,
    type,
    criteria: `${type} stored criteria`,
    procedureCode: `${type}-procedure`,
    specification: `${type} specification`,
    method: `${type} method`,
    frequency: 2,
    imgDocumentation: null,
    description: `${type} description`,
    inspectors: [],
    ...values,
  }
}

function workItem(values: Partial<Record<string, unknown>> = {}) {
  return {
    row: { id: 'row-1', volume: '2.00', statusCode: 'waiting' },
    workItem: { id: 'work-1', code: 'W-1', name: 'Work Item One', uomName: 'm³' },
    allowedActions: [],
    snapshots: [],
    verifications: [],
    ...values,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.record = record()
})

afterEach(() => vi.restoreAllMocks())

describe('Quality Inspection report detail', () => {
  it('loads inspection point names once per opening and submits the code', async () => {
    mocks.record = record({ allowedActions: ['complete-report'] })
    mocks.loadTemplate.mockResolvedValue({
      inspectionPoints: [
        { code: 'P', name: 'Perform' },
        { code: 'R', name: 'Record' },
      ],
    })
    mocks.completeReport.mockResolvedValue({})
    const wrapper = mount(Route)

    const button = wrapper.findAll('button').find((entry) => entry.text().includes('Lengkapi Prosedur'))
    expect(button).toBeDefined()
    await button!.trigger('click')
    await nextTick()

    const dialog = wrapper.findComponent({ name: 'DialogForm' })
    const fields = dialog.props('fields') as Record<string, any>
    expect(mocks.loadTemplate).toHaveBeenCalledWith('project-1')
    expect(dialog.props('disabled')).toBe(false)
    expect(fields.inspectionPointCode.form.renderer).toBe('radio')
    expect(fields.inspectionPointCode.form.source).toEqual([
      { id: 'P', name: 'Perform' },
      { id: 'R', name: 'Record' },
    ])
    await (dialog.props('submit') as (input: Record<string, unknown>) => Promise<unknown>)({ inspectionPointCode: 'P', workMethod: 'Method' })
    expect(mocks.completeReport).toHaveBeenCalledWith('qi-1', { inspectionPointCode: 'P', workMethod: 'Method' })

    await nextTick()
    await button!.trigger('click')
    await nextTick()
    expect(mocks.loadTemplate).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('shows loading and empty states for the inspection point field', async () => {
    mocks.record = record({ allowedActions: ['complete-report'] })
    let resolveTemplate!: (value: unknown) => void
    mocks.loadTemplate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTemplate = resolve
        })
    )
    const wrapper = mount(Route)
    const button = wrapper.findAll('button').find((entry) => entry.text().includes('Lengkapi Prosedur'))
    await button!.trigger('click')
    await nextTick()

    const dialog = wrapper.findComponent({ name: 'DialogForm' })
    expect(dialog.props('description')).toBe('Memuat Inspection Point...')
    expect(dialog.props('disabled')).toBe(true)
    resolveTemplate({ inspectionPoints: [] })
    await nextTick()
    await Promise.resolve()
    await nextTick()
    expect(dialog.props('description')).toBe('Tidak ada Inspection Point aktif.')
    expect(dialog.props('disabled')).toBe(true)
    wrapper.unmount()
  })

  it('shows the template error without changing the server action contract', async () => {
    mocks.record = record({ allowedActions: ['complete-report'] })
    mocks.loadTemplate.mockRejectedValue(new Error('Template unavailable'))
    const wrapper = mount(Route)
    const button = wrapper.findAll('button').find((entry) => entry.text().includes('Lengkapi Prosedur'))
    await button!.trigger('click')
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const dialog = wrapper.findComponent({ name: 'DialogForm' })
    expect(dialog.props('description')).toContain('Template unavailable')
    expect(dialog.props('disabled')).toBe(true)
    wrapper.unmount()
  })

  it('shows reporter and result fields once without procedure data at report stage', () => {
    const wrapper = mount(Route)
    expect(wrapper.text()).toContain('Dilaporkan Oleh:Inspector One')
    expect(wrapper.text()).toContain('Hasil Inspeksi:—')
    expect(wrapper.text()).toContain('Catatan:—')
    expect(wrapper.text()).not.toContain('Inspection Point:')
    expect(wrapper.text()).not.toContain('Prosedur / Metode Kerja:')
    expect(wrapper.text()).not.toContain('Asal Jadwal')
    wrapper.unmount()
  })

  it('shows the procedure section after report completion', () => {
    mocks.record = record({ stepCode: 'complete-report', inspectionPointCode: 'Point A', workMethod: 'Method A' })
    const wrapper = mount(Route)
    expect(wrapper.text()).toContain('Prosedur & Penyelesaian')
    expect(wrapper.text()).toContain('Inspection Point:Point A')
    expect(wrapper.text()).toContain('Prosedur / Metode Kerja:Method A')
    wrapper.unmount()
  })

  it('shows closed result and note with the procedure section', () => {
    mocks.record = record({ stepCode: 'close', statusCode: 'close', resultCode: 'approved', verificationDescription: 'Looks good', inspectionPointCode: 'Point A', workMethod: 'Method A' })
    const wrapper = mount(Route)
    expect(wrapper.text()).toContain('Diterima')
    expect(wrapper.text()).toContain('Catatan:Looks good')
    expect(wrapper.text()).toContain('Inspection Point:Point A')
    wrapper.unmount()
  })

  it('shows stored schedule snapshots for a scheduled report', () => {
    mocks.record = record({ scheduleId: 'schedule-1', scheduleStartDate: '2026-08-01', scheduleEndDate: '2026-08-31' })
    const wrapper = mount(Route)
    expect(wrapper.text()).toContain('Asal Jadwal')
    expect(wrapper.text()).toContain('Periode Mulai:2026-08-01')
    expect(wrapper.text()).toContain('Periode Selesai:2026-08-31')
    wrapper.unmount()
  })

  it('prefills the editable documentation form at the inspected stage', () => {
    mocks.record = record({ stepCode: 'inspected', statusCode: 'on-progress', allowedActions: ['documentation'], documentations: documentations() })
    const wrapper = mount(Route)
    const form = wrapper.findComponent({ name: 'QualityInspectionDocumentationForm' })
    expect(form.exists()).toBe(true)
    expect(form.props('initial')).toMatchObject({
      'sudut 1': 'uploads/sudut-1.jpg',
      'sudut 1Description': 'Catatan sudut 1',
      'sudut 4': 'uploads/sudut-4.jpg',
      'sudut 4Description': 'Catatan sudut 4',
    })
    expect(wrapper.find('[data-testid="documentation-gallery"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it.each(['submitted', 'close'] as const)('renders read-only documentation for the %s stage', (stepCode) => {
    mocks.record = record({ stepCode, statusCode: stepCode === 'close' ? 'close' : 'on-progress', documentations: documentations() })
    const wrapper = mount(Route)
    expect(wrapper.find('[data-testid="documentation-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="documentation-gallery"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="image-preview"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('sudut 1')
    expect(wrapper.text()).toContain('Catatan sudut 1')
    expect(wrapper.text()).toContain('sudut 4')
    expect(wrapper.text()).toContain('Catatan sudut 4')
    wrapper.unmount()
  })

  it('shows an empty message for incomplete documentation before submission', () => {
    mocks.record = record({ stepCode: 'inspected', statusCode: 'on-progress', documentations: [] })
    const wrapper = mount(Route)
    expect(wrapper.find('[data-testid="documentation-gallery"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="image-preview"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('Dokumentasi belum tersedia.')
    wrapper.unmount()
  })

  it('renders grouped criteria, volume unit, and only server-authorized item actions', () => {
    mocks.record = record({
      allowedActions: ['verify-work-item'],
      workItems: [
        workItem({ allowedActions: ['verify-work-item'], snapshots: [snapshot('material'), snapshot('process'), snapshot('product')] }),
        workItem({
          row: { id: 'row-2', volume: '3.00', statusCode: 'waiting' },
          workItem: { id: 'work-2', code: 'W-2', name: 'Work Item Two', uomName: 'm³' },
          snapshots: [snapshot('material', { id: 'material-snapshot-2' })],
        }),
      ],
    })
    const wrapper = mount(Route)
    const text = wrapper.text()
    expect(text).toContain('Volume:2.00 m³')
    expect(text).toContain('Menunggu')
    expect(text).toContain('Belum ada riwayat inspeksi.')
    expect(text).toContain('material stored criteria')
    expect(text).toContain('process stored criteria')
    expect(text).toContain('product stored criteria')
    expect(wrapper.findAll('[aria-label="Tidak ada kriteria"]')).toHaveLength(2)
    expect(text).toContain('Terima')
    expect(text).toContain('Tolak')
    expect(wrapper.findAll('button').filter((button) => button.text() === 'Terima')).toHaveLength(1)
    expect(wrapper.findAll('button').filter((button) => button.text() === 'Tolak')).toHaveLength(1)
    wrapper.unmount()
  })

  it('links each reused PTS and keeps every rejection event readable', () => {
    mocks.record = record({
      workItems: [
        workItem({
          pts: { id: 'pts-1', number: 'PTS-001', statusCode: 'on-progress', stepCode: 'qi-report' },
        }),
      ],
      ptsRejections: [
        { id: 'rejection-1', qualityInspectionWorkItemItpId: 'row-1', qhssePtsId: 'pts-1', note: 'Needs correction', rejectedAt: '2026-08-20T08:00:00.000Z' },
        { id: 'rejection-2', qualityInspectionWorkItemItpId: 'row-1', qhssePtsId: 'pts-1', note: 'Still open', rejectedAt: '2026-08-21T08:00:00.000Z' },
      ],
    })
    const wrapper = mount(Route)
    const text = wrapper.text()
    expect(text).toContain('PTS-001')
    expect(text).toContain('In progress')
    expect(text).toContain('Inspection/Test report')
    expect(text).toContain('Needs correction · 2026-08-20T08:00:00.000Z')
    expect(text).toContain('Still open · 2026-08-21T08:00:00.000Z')
    expect(text).not.toContain('on-progress')
    expect(text).not.toContain('qi-report')

    const links = wrapper.findAllComponents({ name: 'RouterLink' })
    expect(links).toHaveLength(2)
    for (const link of links) expect(link.props('to')).toEqual({ name: 'quality-pts-detail', params: { ptsId: 'pts-1' } })
    wrapper.unmount()
  })

  it('keeps the empty PTS state when no item has a linked PTS', () => {
    const wrapper = mount(Route)
    expect(wrapper.text()).toContain('Tidak ada PTS terkait.')
    expect(wrapper.findAllComponents({ name: 'RouterLink' })).toHaveLength(0)
    wrapper.unmount()
  })

  it('places each approved action at its server-authorized stage', async () => {
    const cases = [
      {
        stepCode: 'report',
        statusCode: 'open',
        allowedActions: ['complete-report'],
        workItems: [workItem({ allowedActions: ['verify-work-item'] })],
        text: 'Lengkapi Prosedur & Penyelesaian',
        absent: ['Verifikasi Item', 'Submit Inspection Data', 'Verifikasi Laporan', 'Terima', 'Tolak'],
      },
      {
        stepCode: 'complete-report',
        statusCode: 'on-progress',
        allowedActions: ['verify-work-item'],
        workItems: [workItem({ allowedActions: ['verify-work-item'] })],
        text: 'Terima',
        absent: ['Lengkapi Prosedur & Penyelesaian', 'Submit Inspection Data', 'Verifikasi Laporan'],
      },
      {
        stepCode: 'inspected',
        statusCode: 'on-progress',
        allowedActions: ['documentation'],
        documentations: documentations(),
        text: 'Submit Inspection Data',
        absent: ['Lengkapi Prosedur & Penyelesaian', 'Verifikasi Laporan', 'Terima', 'Tolak'],
      },
      {
        stepCode: 'submitted',
        statusCode: 'on-progress',
        allowedActions: ['verify'],
        documentations: documentations(),
        text: 'Verifikasi Laporan',
        absent: ['Lengkapi Prosedur & Penyelesaian', 'Submit Inspection Data', 'Terima', 'Tolak'],
      },
      {
        stepCode: 'close',
        statusCode: 'close',
        allowedActions: [],
        documentations: documentations(),
        text: 'Riwayat Audit',
        absent: ['Lengkapi Prosedur & Penyelesaian', 'Verifikasi Item', 'Submit Inspection Data', 'Verifikasi Laporan', 'Terima', 'Tolak'],
      },
    ] as const

    for (const current of cases) {
      mocks.record = record(current)
      const wrapper = mount(Route)
      expect(wrapper.text()).toContain(current.text)
      for (const absent of current.absent) expect(wrapper.text()).not.toContain(absent)
      wrapper.unmount()
    }
  })

  it('keeps the action dialog open after an error and ignores duplicate submits', async () => {
    mocks.record = record({ allowedActions: ['complete-report'] })
    mocks.loadTemplate.mockResolvedValue({ inspectionPoints: [{ code: 'P', name: 'Perform' }] })
    let resolveComplete!: (value: unknown) => void
    mocks.completeReport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveComplete = resolve
        })
    )
    const wrapper = mount(Route)
    const button = wrapper.findAll('button').find((entry) => entry.text().includes('Lengkapi Prosedur'))
    await button!.trigger('click')
    await nextTick()
    const dialog = wrapper.findComponent({ name: 'DialogForm' })
    const submit = dialog.props('submit') as (input: Record<string, unknown>) => Promise<unknown>
    const first = submit({ inspectionPointCode: 'P', workMethod: 'Method' })
    const second = submit({ inspectionPointCode: 'P', workMethod: 'Method' })
    expect(mocks.completeReport).toHaveBeenCalledTimes(1)
    resolveComplete({})
    await first
    await second
    expect(wrapper.findComponent({ name: 'DialogForm' }).exists()).toBe(false)

    mocks.record = record({ allowedActions: ['complete-report'] })
    mocks.completeReport.mockRejectedValue(new Error('Action failed'))
    await button!.trigger('click')
    await nextTick()
    const errorDialog = wrapper.findComponent({ name: 'DialogForm' })
    await expect((errorDialog.props('submit') as (input: Record<string, unknown>) => Promise<unknown>)({ inspectionPointCode: 'P', workMethod: 'Method' })).rejects.toThrow('Action failed')
    expect(wrapper.findComponent({ name: 'DialogForm' }).exists()).toBe(true)
    expect(mocks.toastError).toHaveBeenCalledWith('Action failed')
    wrapper.unmount()
  })

  it('renders every audit history group with actor, result, time, and note', () => {
    mocks.record = record({
      activity: [
        { id: 'activity-1', shortDescription: 'Inspection/Test created.', actorUserId: 'user-1', actorName: 'Inspector One', createdAt: '2026-08-20T07:00:00.000Z', description: null },
        { id: 'activity-2', shortDescription: 'Inspection/Test repair.', actorUserId: 'user-2', actorName: 'Inspector Two', createdAt: '2026-08-21T07:00:00.000Z', description: 'Repair required' },
      ],
      workItems: [
        workItem({
          pts: { id: 'pts-1', number: 'PTS-001', statusCode: 'open', stepCode: 'qi-report' },
          verifications: [
            { id: 'item-event-1', resultCode: 'approved', verifierId: 'user-1', verifierName: 'Inspector One', verifiedAt: '2026-08-20T08:00:00.000Z', description: null },
            { id: 'item-event-2', resultCode: 'rejected', verifierId: 'user-2', verifierName: 'Inspector Two', verifiedAt: '2026-08-21T08:00:00.000Z', description: 'Repair failed' },
          ],
        }),
      ],
      verifications: [
        { id: 'report-event-1', resultCode: 'pending', verifierId: 'user-2', verifierName: 'Inspector Two', verifiedAt: '2026-08-22T08:00:00.000Z', description: 'Pending review' },
        { id: 'report-event-2', resultCode: 'repair', verifierId: 'user-1', verifierName: 'Inspector One', verifiedAt: '2026-08-23T08:00:00.000Z', description: 'Repair required' },
      ],
      ptsRejections: [
        {
          id: 'pts-event-1',
          qualityInspectionWorkItemItpId: 'row-1',
          qhssePtsId: 'pts-1',
          rejectingUserId: 'user-1',
          rejectingUserName: 'Inspector One',
          rejectedAt: '2026-08-21T08:00:00.000Z',
          note: 'Needs correction',
        },
        {
          id: 'pts-event-2',
          qualityInspectionWorkItemItpId: 'row-1',
          qhssePtsId: 'pts-1',
          rejectingUserId: 'user-2',
          rejectingUserName: 'Inspector Two',
          rejectedAt: '2026-08-22T08:00:00.000Z',
          note: 'Still open',
        },
      ],
    })
    const wrapper = mount(Route)
    const text = wrapper.text()
    expect(text).toContain('Riwayat Audit')
    expect(text).toContain('Aktivitas')
    expect(text).toContain('Riwayat Inspeksi Item')
    expect(text).toContain('Riwayat Hasil Laporan')
    expect(text).toContain('Riwayat Penolakan PTS')
    expect(text).toContain('oleh Inspector One')
    expect(text).toContain('oleh Inspector Two')
    expect(text).toContain('Diterima')
    expect(text).toContain('Ditolak')
    expect(text).toContain('Ditunda')
    expect(text).toContain('Diperbaiki')
    expect(wrapper.findAll('code')).toHaveLength(0)
    expect(text).toContain('2026-08-23T08:00:00.000Z')
    expect(text).toContain('Pending review')
    expect(text).toContain('Needs correction')
    expect(text).toContain('Still open')
    expect(wrapper.findAll('[data-testid="timeline"]')).toHaveLength(3)
    expect(wrapper.findAll('[data-testid="table"]')).toHaveLength(3)
    wrapper.unmount()
  })

  it('uses the approved action labels and framework fields for item and report verification', async () => {
    mocks.record = record({ stepCode: 'complete-report', statusCode: 'on-progress', allowedActions: ['verify-work-item'], workItems: [workItem({ allowedActions: ['verify-work-item'] })] })
    const wrapper = mount(Route)
    await wrapper
      .findAll('button')
      .find((entry) => entry.text() === 'Tolak')!
      .trigger('click')
    await nextTick()
    const itemDialog = wrapper.findComponent({ name: 'DialogForm' })
    expect(itemDialog.text()).toContain('Verifikasi Item')
    const itemFields = itemDialog.props('fields') as Record<string, any>
    expect(itemFields.resultCode).toBeUndefined()
    expect(itemFields.description.form.renderer).toBe('textarea')
    await (itemDialog.props('submit') as (input: Record<string, unknown>) => Promise<unknown>)({ description: 'Needs correction' })
    expect(mocks.verifyWorkItem).toHaveBeenCalledWith('qi-1', 'row-1', { description: 'Needs correction', resultCode: 'rejected' })
    wrapper.unmount()

    mocks.record = record({ stepCode: 'submitted', statusCode: 'on-progress', allowedActions: ['verify'], documentations: documentations() })
    const submittedWrapper = mount(Route)
    const verifyButton = submittedWrapper.findAll('button').find((entry) => entry.text() === 'Verifikasi Laporan')
    expect(verifyButton).toBeDefined()
    await verifyButton!.trigger('click')
    await nextTick()
    const reportDialog = submittedWrapper.findComponent({ name: 'DialogForm' })
    expect(reportDialog.text()).toContain('Verifikasi Laporan')
    expect((reportDialog.props('fields') as Record<string, any>).resultCode.form.renderer).toBe('radio')
    expect((reportDialog.props('fields') as Record<string, any>).description.form.renderer).toBe('textarea')
    submittedWrapper.unmount()
  })

  it('renders current item results and every append-only verification event', () => {
    mocks.record = record({
      workItems: [
        workItem({
          row: { id: 'row-approved', volume: '2.00', statusCode: 'approved' },
          verifications: [{ id: 'verification-approved', resultCode: 'approved', description: null, verifierId: 'user-1', verifierName: 'Inspector One', verifiedAt: '2026-08-20T08:00:00.000Z' }],
        }),
        workItem({
          row: { id: 'row-rejected', volume: '3.00', statusCode: 'rejected' },
          verifications: [
            { id: 'verification-first', resultCode: 'approved', description: null, verifierId: 'user-1', verifierName: 'Inspector One', verifiedAt: '2026-08-20T08:00:00.000Z' },
            { id: 'verification-second', resultCode: 'rejected', description: 'Repair failed', verifierId: 'user-2', verifierName: 'Inspector Two', verifiedAt: '2026-08-21T08:00:00.000Z' },
          ],
        }),
      ],
    })
    const wrapper = mount(Route)
    const text = wrapper.text()
    expect(text).toContain('Inspeksi dilakukan oleh Inspector One pada 2026-08-20T08:00:00.000Z')
    expect(text).toContain('Tidak ada catatan')
    expect(text).toContain('Inspeksi dilakukan oleh Inspector Two pada 2026-08-21T08:00:00.000Z')
    expect(text).toContain('Repair failed')
    expect(text).toContain('Diterima')
    expect(text).toContain('Ditolak')
    expect(wrapper.findAll('[data-testid="timeline"]')).toHaveLength(2)
    expect(wrapper.findAll('button').filter((button) => button.text() === 'Terima')).toHaveLength(0)
    expect(wrapper.findAll('button').filter((button) => button.text() === 'Tolak')).toHaveLength(0)
    wrapper.unmount()
  })

  it('renders every stored snapshot field, nested point value, image, and description', () => {
    mocks.record = record({
      workItems: [
        workItem({
          snapshots: [
            snapshot('material', {
              criteria: 'Stored criteria',
              procedureCode: 'Stored procedure',
              specification: 'Stored specification',
              method: 'Stored method',
              frequency: 7,
              imgDocumentation: 'uploads/stored.jpg',
              description: 'Stored description',
              inspectors: [{ id: 'inspector-1', inspectorTypeName: 'Stored Inspector', points: [{ id: 'point-1', inspectionPointName: 'Stored Point', value: true }] }],
            }),
          ],
        }),
      ],
    })
    const wrapper = mount(Route)
    const text = wrapper.text()
    expect(text).toContain('Metode Inspeksi:Material')
    expect(text).toContain('Kriteria/Tolok Ukur Penerimaan:Stored criteria')
    expect(text).toContain('Kode Prosedur:Stored procedure')
    expect(text).toContain('Spesifikasi:Stored specification')
    expect(text).toContain('Metode:Stored method')
    expect(text).toContain('Frekuensi:7')
    expect(text).toContain('Jenis Inspektor:Stored Inspector')
    expect(text).toContain('Inspection Point:Stored Point')
    expect(text).toContain('Ya')
    expect(text).toContain('Deskripsi:Stored description')
    expect(wrapper.find('[data-testid="image-preview"]').attributes('src')).toContain('stored.jpg')
    wrapper.unmount()
  })
})
