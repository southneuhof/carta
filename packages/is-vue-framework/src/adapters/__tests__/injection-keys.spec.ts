import { createApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { frameworkRuntimeKey } from '../../runtime'
import { frameworkDefaultsKey } from '../defaults'
import { FrameworkPlugin } from '../plugin'
import { frameworkAdaptersKey } from '../projectAdapters'
import { frameworkQueryClientKey } from '../../query/client'
import { rendererRegistriesKey } from '../../renderers/registry'

describe('framework injection keys', () => {
  it('uses realm-stable symbols for every plugin-provided dependency', () => {
    expect(frameworkRuntimeKey).toBe(Symbol.for('is-vue-framework-runtime'))
    expect(frameworkDefaultsKey).toBe(Symbol.for('is-vue-framework-defaults'))
    expect(frameworkAdaptersKey).toBe(Symbol.for('is-vue-framework-adapters'))
    expect(frameworkQueryClientKey).toBe(Symbol.for('is-vue-framework-query-client'))
    expect(rendererRegistriesKey).toBe(Symbol.for('is-vue-framework-renderers'))
  })

  it('keeps provided runtime values isolated per Vue app', () => {
    const firstRuntime = { table: { getData: async () => ({ data: [] }) } }
    const secondRuntime = { table: { getData: async () => ({ data: [] }) } }
    const App = defineComponent(() => () => h('div'))
    const first = createApp(App).use(FrameworkPlugin, firstRuntime)
    const second = createApp(App).use(FrameworkPlugin, secondRuntime)

    expect(first._context.provides[frameworkRuntimeKey as symbol]).toBe(firstRuntime)
    expect(second._context.provides[frameworkRuntimeKey as symbol]).toBe(secondRuntime)
    expect(first._context.provides[frameworkRuntimeKey as symbol]).not.toBe(second._context.provides[frameworkRuntimeKey as symbol])
  })
})
