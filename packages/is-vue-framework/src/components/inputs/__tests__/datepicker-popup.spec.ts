import { createApp, defineComponent, h, nextTick, type Component } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DateInput from '../DateInput.vue'
import DateRangeInput from '../DateRangeInput.vue'
import MonthInput from '../MonthInput.vue'
import TimeInput from '../TimeInput.vue'
import YearInput from '../YearInput.vue'

const picker = vi.hoisted(() => ({
  latest: {} as Record<string, unknown>,
}))

vi.mock('@vuepic/vue-datepicker', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      inheritAttrs: false,
      props: {
        modelValue: null,
        teleport: null,
        config: null,
        inline: Boolean,
        timePicker: Boolean,
        range: Boolean,
        weekPicker: Boolean,
        monthPicker: Boolean,
        yearPicker: Boolean,
      },
      setup(props, { attrs }) {
        return () => {
          picker.latest = { ...props, class: attrs.class }
          return h('div')
        }
      },
    }),
  }
})

const inputs: Array<[string, Component]> = [
  ['Date', DateInput],
  ['Time', TimeInput],
  ['DateRange', DateRangeInput],
  ['Month', MonthInput],
  ['Year', YearInput],
]

async function mountInput(component: Component, props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  const app = createApp(defineComponent({
    setup: () => () => h(component, props),
  }))
  app.mount(host)
  await nextTick()
  return () => app.unmount()
}

describe('datepicker popup safety', () => {
  beforeEach(() => {
    picker.latest = {}
  })

  it.each(inputs)('%s uses shared popup defaults', async (_name, component) => {
    const unmount = await mountInput(component)

    expect(picker.latest.teleport).toBe(true)
    expect(picker.latest.config).toEqual({
      allowPreventDefault: false,
      allowStopPropagation: true,
    })
    expect(picker.latest.class).toContain('pointer-events-auto')
    unmount()
  })

  it.each(inputs)('%s preserves an explicit teleport target', async (_name, component) => {
    const unmount = await mountInput(component, { teleport: '#picker-root' })

    expect(picker.latest.teleport).toBe('#picker-root')
    unmount()
  })

  it('preserves inline and specialized picker modes', async () => {
    let unmount = await mountInput(DateInput, { inline: true })
    expect(picker.latest.inline).toBe(true)
    unmount()

    unmount = await mountInput(TimeInput)
    expect(picker.latest.timePicker).toBe(true)
    unmount()

    unmount = await mountInput(DateRangeInput, { unit: 'week' })
    expect(picker.latest.weekPicker).toBe(true)
    unmount()

    unmount = await mountInput(MonthInput)
    expect(picker.latest.monthPicker).toBe(true)
    unmount()

    unmount = await mountInput(YearInput)
    expect(picker.latest.yearPicker).toBe(true)
    unmount()
  })
})
