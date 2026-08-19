import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  fileUrl: vi.fn((key: string) => `/files/${key}`),
  handlePrint: vi.fn(),
}))

vi.mock('@southneuhof/is-vue-framework/components/utils/Printable.vue', () => ({
  default: {
    props: ['documentTitle'],
    setup() { return { handlePrint: mocks.handlePrint } },
    template: '<div data-testid="printable"><slot name="trigger" :handle-print="handlePrint" /><div data-testid="print-content"><slot name="content" /></div></div>',
  },
}))

vi.mock('@southneuhof/is-vue-framework/components/base', () => ({
  Button: { template: '<button v-bind="$attrs"><slot name="icon" /><slot /></button>' },
  ImagePreview: { props: ['imageURL'], template: '<img data-testid="image-preview" :src="imageURL" />' },
}))

vi.mock('qrcode.vue', () => ({
  default: { props: ['value', 'size'], template: '<div data-testid="qr-code" :data-value="value" />' },
}))

vi.mock('@/framework/adapters/storage', () => ({ fileUrl: mocks.fileUrl }))

const Export = (await import('./QualityInspectionEvidenceExport.vue')).default

function snapshot(type: string, values: Record<string, unknown> = {}) {
  return {
    id: `${type}-snapshot`,
    type,
    criteria: `${type} criteria`,
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

function record(values: Record<string, unknown> = {}) {
  return {
    id: 'qi-1',
    number: 'QI-001',
    createdAt: '2026-08-19T10:11:12.000Z',
    createdByUser: { id: 'user-1', name: 'Inspector One' },
    division: { name: 'Division One' },
    project: { name: 'Project One' },
    qualityWorkCategory: { name: 'Category One' },
    workItemCategory: { name: 'Root Item One' },
    targetDate: '2026-08-20',
    locationZone: 'Zone A',
    inspectionPointCode: 'IP-01',
    workMethod: 'Visual inspection procedure',
    statusCode: 'close',
    stepCode: 'close',
    workItems: [
      {
        row: { id: 'row-1', volume: '12.50', statusCode: 'approved' },
        workItem: { name: 'Work Item One', uomName: 'm³' },
        verifications: [{ verifierName: 'Verifier One', verifiedAt: '2026-08-21T12:00:00.000Z', resultCode: 'approved' }],
        snapshots: [
          snapshot('material', { imgDocumentation: 'uploads/material.jpg', inspectors: [{ id: 'inspector-1', inspectorTypeName: 'Inspector', points: [{ id: 'point-1', inspectionPointName: 'Point One', value: true }] }] }),
          snapshot('process'),
          snapshot('product'),
        ],
      },
      {
        row: { id: 'row-2', volume: '3.00', statusCode: 'waiting' },
        workItem: { name: 'Work Item Two', uomName: 'kg' },
        verifications: [],
        snapshots: [snapshot('material')],
      },
    ],
    documentations: ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'].map((name) => ({
      name,
      fileAttachment: `uploads/${name.replace(' ', '-')}.jpg`,
      description: `Description ${name}`,
    })),
    ...values,
  }
}

describe('Quality Inspection evidence export', () => {
  it('prints the closed legacy report sections, stored item data, QR meaning, and four photos', () => {
    const wrapper = mount(Export, { props: { record: record() } })

    expect(wrapper.text()).toContain('Detail Laporan')
    expect(wrapper.text()).toContain('QI-001')
    expect(wrapper.text()).toContain('Inspector One')
    expect(wrapper.text()).toContain('Division One')
    expect(wrapper.text()).toContain('Project One')
    expect(wrapper.text()).toContain('Category One')
    expect(wrapper.text()).toContain('Root Item One')
    expect(wrapper.text()).toContain('2026-08-20')
    expect(wrapper.text()).toContain('Zone A')
    expect(wrapper.text()).toContain('IP-01')
    expect(wrapper.text()).toContain('Visual inspection procedure')
    expect(wrapper.text()).toContain('Prosedur & Penyelesaian')

    const qrValue = wrapper.find('[data-testid="qr-code"]').attributes('data-value')
    expect(qrValue).toContain('Dilaporkan oleh Inspector One pada')
    expect(qrValue).toContain('2026')
    expect(qrValue).not.toContain('{')
    expect(wrapper.find('[data-testid="reporter-qr-text"]').text()).toBe(qrValue)

    const items = wrapper.findAll('[data-testid="evidence-item"]')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('Volume12.50')
    expect(items[0]!.text()).toContain('Satuanm³')
    expect(items[0]!.text()).toContain('Diterima')
    expect(items[0]!.text()).toContain('Inspeksi dilakukan oleh Verifier One pada 2026-08-21T12:00:00.000Z')
    expect(items[0]!.text()).toContain('material criteria')
    expect(items[0]!.text()).toContain('process criteria')
    expect(items[0]!.text()).toContain('product criteria')
    expect(items[0]!.text()).toContain('material-procedure')
    expect(items[0]!.text()).toContain('material specification')
    expect(items[0]!.text()).toContain('material method')
    expect(items[0]!.text()).toContain('2')
    expect(items[0]!.text()).toContain('material description')
    expect(items[0]!.text()).toContain('Jenis Inspektor: Inspector')
    expect(items[0]!.text()).toContain('Point One: Ya')
    expect(items[1]!.find('[data-criteria-type="product"]').text()).toContain('—')

    const slots = wrapper.findAll('[data-testid="documentation-slot"]')
    expect(slots).toHaveLength(4)
    expect(slots.map((slot) => slot.find('h3').text())).toEqual(['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'])
    expect(slots[0]!.text()).toContain('Description sudut 1')
    expect(slots[3]!.text()).toContain('Description sudut 4')
    expect(wrapper.findAll('[data-testid="image-preview"]')).toHaveLength(5)
    expect(wrapper.find('[data-testid="documentation-section"]').attributes('style')).toContain('break-before: page')
    expect(mocks.fileUrl).toHaveBeenCalledWith('uploads/material.jpg')
  })

  it.each(['report', 'complete-report', 'inspected', 'submitted'] as const)('does not expose evidence export at %s', (stepCode) => {
    const wrapper = mount(Export, { props: { record: record({ statusCode: 'on-progress', stepCode }) } })
    expect(wrapper.find('[data-testid="printable"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="quality-inspection-evidence"]').exists()).toBe(false)
  })

  it('does not expose evidence export when the status and step are not both closed', () => {
    const wrapper = mount(Export, { props: { record: record({ statusCode: 'close', stepCode: 'submitted' }) } })
    expect(wrapper.find('[data-testid="printable"]').exists()).toBe(false)
  })
})
