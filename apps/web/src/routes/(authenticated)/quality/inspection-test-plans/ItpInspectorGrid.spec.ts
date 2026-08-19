import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ItpInspectorGrid, { type ItpInspectorGridEntry } from './ItpInspectorGrid.vue'

const grid: ItpInspectorGridEntry[] = [
  {
    inspectorTypeId: 'sc',
    inspectorTypeName: 'SubCon',
    points: [
      { inspectionPointCode: 'P', inspectionPointName: 'Perform', value: false },
      { inspectionPointCode: 'R', inspectionPointName: 'Record', value: false },
    ],
  },
]

describe('ItpInspectorGrid', () => {
  it('renders every inspector type and point, and toggles one point in a full grid', async () => {
    const wrapper = mount(ItpInspectorGrid, { props: { modelValue: grid } })

    expect(wrapper.findAll('[data-itp-inspector-grid] input[type="checkbox"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('SubCon')
    expect(wrapper.text()).toContain('Perform')
    await wrapper.findAll('input[type="checkbox"]')[0]!.trigger('change')

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([
      {
        ...grid[0],
        points: [
          { inspectionPointCode: 'P', inspectionPointName: 'Perform', value: true },
          { inspectionPointCode: 'R', inspectionPointName: 'Record', value: false },
        ],
      },
    ])
  })

  it('keeps an all-false grid valid and does not toggle while disabled', async () => {
    const wrapper = mount(ItpInspectorGrid, { props: { modelValue: grid, disabled: true } })
    expect(grid.every((inspector) => inspector.points.every((point) => point.value === false))).toBe(true)
    await wrapper.find('input[type="checkbox"]').trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('[aria-disabled="true"]').exists()).toBe(true)
  })
})
