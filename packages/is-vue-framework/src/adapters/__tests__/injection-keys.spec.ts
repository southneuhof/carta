import { createApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { frameworkFieldDefaultsKey } from '../../fields'
import { FrameworkPlugin } from '../plugin'
import { frameworkAdaptersKey } from '../projectAdapters'
import { frameworkQueryClientKey } from '../../query/client'
import { rendererRegistriesKey } from '../../renderers/registry'

describe('framework injection keys', () => {
  it('uses realm-stable symbols for every plugin-provided dependency', () => {
    expect(frameworkFieldDefaultsKey).toBe(Symbol.for('is-vue-framework-field-defaults'))
    expect(frameworkAdaptersKey).toBe(Symbol.for('is-vue-framework-adapters'))
    expect(frameworkQueryClientKey).toBe(Symbol.for('is-vue-framework-query-client'))
    expect(rendererRegistriesKey).toBe(Symbol.for('is-vue-framework-renderers'))
  })

  it('keeps provided field defaults isolated per Vue app', () => {
    const App = defineComponent(() => () => h('div'))
    const first = createApp(App).use(FrameworkPlugin, { fieldDefaults: { table: { align: 'start' } } })
    const second = createApp(App).use(FrameworkPlugin, { fieldDefaults: { table: { align: 'end' } } })

    expect(first._context.provides[frameworkFieldDefaultsKey as symbol]).toEqual({
      table: { align: 'start', props: {} }, detail: { props: {} }, form: { props: {} }, fields: {},
    })
    expect(second._context.provides[frameworkFieldDefaultsKey as symbol]).toEqual({
      table: { align: 'end', props: {} }, detail: { props: {} }, form: { props: {} }, fields: {},
    })
  })
})
