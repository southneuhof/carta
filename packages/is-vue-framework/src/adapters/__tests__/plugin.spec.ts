import { createApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { FrameworkPlugin } from '../plugin'
import { frameworkFieldDefaultsKey } from '../../fields'
import { frameworkAdaptersKey } from '../projectAdapters'
import { frameworkQueryClientKey } from '../../query'
import { rendererRegistriesKey } from '../../renderers/registry'
import { useResourceRuntime } from '../../resources/runtime'

const App = defineComponent(() => () => h('div'))

describe('FrameworkPlugin', () => {
  it('installs without options', () => {
    const app = createApp(App).use(FrameworkPlugin)
    expect(app._context.provides[frameworkFieldDefaultsKey as symbol]).toEqual({
      table: { props: {} }, detail: { props: {} }, form: { props: {} }, fields: {},
    })
  })

  it('provides canonical options per app', () => {
    const first = createApp(App).use(FrameworkPlugin, { fieldDefaults: { shared: { props: { dense: true } } } })
    const second = createApp(App).use(FrameworkPlugin, { fieldDefaults: { table: { align: 'end' } } })
    for (const app of [first, second]) {
      expect(app._context.provides[frameworkAdaptersKey as symbol]).toBeDefined()
      expect(app._context.provides[rendererRegistriesKey as symbol]).toBeDefined()
      expect(app._context.provides[frameworkQueryClientKey as symbol]).toBeDefined()
    }
    expect(first._context.provides[frameworkFieldDefaultsKey as symbol])
      .not.toBe(second._context.provides[frameworkFieldDefaultsKey as symbol])
    expect(useResourceRuntime().fieldDefaults)
      .toBe(second._context.provides[frameworkFieldDefaultsKey as symbol])
  })

  it('rejects legacy options at compile time', () => {
    if (false) {
      // @ts-expect-error removed runtime option
      createApp(App).use(FrameworkPlugin, { runtime: {} })
      // @ts-expect-error removed defaults option
      createApp(App).use(FrameworkPlugin, { defaults: {} })
      // @ts-expect-error raw runtime-shaped object is not plugin options
      createApp(App).use(FrameworkPlugin, { table: {} })
    }
    expect(true).toBe(true)
  })
})
