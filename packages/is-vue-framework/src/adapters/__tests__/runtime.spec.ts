import { createApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { FrameworkPlugin } from '../plugin'
import { useFrameworkRuntime } from '../../runtimeHooks'

describe('framework runtime', () => {
  it('provides runtime to descendants', () => {
    const runtime = { table: { getData: async () => ({ data: [] }) } }
    let received: unknown
    const App = defineComponent({ setup() { received = useFrameworkRuntime(); return () => h('div') } })
    const app = createApp(App)
    const host = document.createElement('div')
    app.use(FrameworkPlugin, runtime)
    app.mount(host)
    app.unmount()
    expect(received).toBe(runtime)
  })

  it('isolates runtimes between apps', () => {
    const first = { table: { getData: async () => ({ data: [] }) } }
    const second = { table: { getData: async () => ({ data: [] }) } }
    const seen: unknown[] = []
    const App = defineComponent({ setup: () => { seen.push(useFrameworkRuntime()); return () => h('div') } })
    const app1 = createApp(App).use(FrameworkPlugin, first)
    const app2 = createApp(App).use(FrameworkPlugin, second)
    app1.mount(document.createElement('div'))
    app2.mount(document.createElement('div'))
    app1.unmount()
    app2.unmount()
    expect(seen).toEqual([first, second])
  })

  it('rejects missing runtime object', () => {
    expect(() => createApp(defineComponent(() => () => h('div'))).use(FrameworkPlugin, null as never)).toThrow('[vue-framework] FrameworkPlugin requires a runtime object.')
  })

  it('reports missing installation clearly', () => {
    let error: unknown
    const App = defineComponent({ setup() { try { useFrameworkRuntime() } catch (caught) { error = caught }; return () => h('div') } })
    const app = createApp(App)
    app.mount(document.createElement('div'))
    app.unmount()
    expect(error).toEqual(new Error('[is-vue-framework] FrameworkPlugin is not installed.'))
  })
})
