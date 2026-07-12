import { createApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { FrameworkPlugin } from '../plugin'
import { useFrameworkBehaviors, useFrameworkRuntime } from '../../runtimeHooks'

describe('framework runtime', () => {
  it('provides behaviors to descendants', () => {
    const behavior = { table: { getData: async () => ({ data: [] }) } }
    let received: unknown
    const App = defineComponent({
      setup() {
        received = useFrameworkBehaviors()
        return () => h('div')
      },
    })
    const app = createApp(App)
    const host = document.createElement('div')
    app.use(FrameworkPlugin, { behaviors: behavior })
    app.mount(host)
    app.unmount()
    expect(received).toBe(behavior)
  })

  it('isolates runtimes between apps', () => {
    const first = { table: { getData: async () => ({ data: [] }) } }
    const second = { table: { getData: async () => ({ data: [] }) } }
    const seen: unknown[] = []
    const App = defineComponent({ setup: () => { seen.push(useFrameworkBehaviors()); return () => h('div') } })
    const host1 = document.createElement('div')
    const host2 = document.createElement('div')
    const app1 = createApp(App).use(FrameworkPlugin, { behaviors: first })
    const app2 = createApp(App).use(FrameworkPlugin, { behaviors: second })
    app1.mount(host1)
    app2.mount(host2)
    app1.unmount()
    app2.unmount()
    expect(seen).toEqual([first, second])
  })

  it('reports missing installation clearly', () => {
    let error: unknown
    const App = defineComponent({
      setup() {
        try {
          useFrameworkRuntime()
        } catch (caught) {
          error = caught
        }
        return () => h('div')
      },
    })
    const app = createApp(App)
    const host = document.createElement('div')
    app.mount(host)
    app.unmount()
    expect(error).toEqual(new Error('[is-vue-framework] FrameworkPlugin is not installed.'))
  })
})
