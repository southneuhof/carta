import { createApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { FrameworkPlugin } from '../plugin'
import { resolveFrameworkDefaults } from '../defaults'
import { useFrameworkRuntime } from '../../runtimeHooks'
import { useFrameworkDefaults } from '../../defaultsHooks'

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

  it('provides normalized defaults with global, section, and prop-ready precedence', () => {
    let received: ReturnType<typeof useFrameworkDefaults> | undefined
    const slot = defineComponent(() => () => h('span'))
    const validation = () => true
    const App = defineComponent({ setup() { received = useFrameworkDefaults(); return () => h('div') } })
    const app = createApp(App).use(FrameworkPlugin, {
      runtime: {},
      defaults: {
        global: {
          fieldsAlias: { name: 'Global', code: 'Code' },
          fieldsParse: { created_at: 'datetime' },
          fieldsProxy: { created_by: 'rel_created_by' },
          fieldsType: { status: { type: 'chip' } },
          fieldSlots: { name: slot },
          inputConfig: { tags: { type: 'custom', props: { values: ['a'], validation } } },
        },
        table: { fieldsAlias: { name: 'Table' } },
        detail: { fieldsType: { name: { type: 'html' } } },
        form: { inputConfig: { tags: { type: 'custom', props: { values: ['b'], validation } } } },
      },
    })
    app.mount(document.createElement('div'))
    app.unmount()

    expect(received?.table.fieldsAlias).toEqual({ name: 'Table', code: 'Code' })
    expect(received?.detail.fieldsAlias.name).toBe('Global')
    expect(received?.table.fieldsParse.created_at).toBe('datetime')
    expect(received?.detail.fieldsProxy.created_by).toBe('rel_created_by')
    expect(received?.table.fieldsType.status).toEqual({ type: 'chip' })
    expect(received?.detail.fieldsType.name).toEqual({ type: 'html' })
    expect(received?.table.fieldSlots.name).toBe(slot)
    expect(received?.form.inputConfig.tags.props).toEqual({ values: ['b'], validation })
  })

  it('does not mutate app defaults while resolving global inheritance', () => {
    const defaults = {
      global: {
        fieldsAlias: { name: 'Global' },
        inputConfig: { name: { type: 'text' } },
      },
      detail: { fieldsAlias: { name: 'Detail' } },
    }

    const resolved = resolveFrameworkDefaults(defaults)

    expect(resolved.table.fieldsAlias.name).toBe('Global')
    expect(resolved.detail.fieldsAlias.name).toBe('Detail')
    expect(resolved.form.inputConfig.name).toEqual({ type: 'text' })
    expect(defaults).toEqual({
      global: {
        fieldsAlias: { name: 'Global' },
        inputConfig: { name: { type: 'text' } },
      },
      detail: { fieldsAlias: { name: 'Detail' } },
    })
  })

  it('isolates defaults between apps', () => {
    const seen: string[] = []
    const App = defineComponent({ setup() { seen.push(useFrameworkDefaults().table.fieldsAlias.name); return () => h('div') } })
    const first = createApp(App).use(FrameworkPlugin, { runtime: {}, defaults: { global: { fieldsAlias: { name: 'First' } } } })
    const second = createApp(App).use(FrameworkPlugin, { runtime: {}, defaults: { global: { fieldsAlias: { name: 'Second' } } } })
    first.mount(document.createElement('div'))
    second.mount(document.createElement('div'))
    first.unmount()
    second.unmount()
    expect(seen).toEqual(['First', 'Second'])
  })

  it('provides empty defaults for the legacy runtime-only signature', () => {
    let received: ReturnType<typeof useFrameworkDefaults> | undefined
    const App = defineComponent({ setup() { received = useFrameworkDefaults(); return () => h('div') } })
    const app = createApp(App).use(FrameworkPlugin, {})
    app.mount(document.createElement('div'))
    app.unmount()
    expect(received?.table.fieldsAlias).toEqual({})
    expect(received?.form.inputConfig).toEqual({})
  })

  it('rejects missing runtime object', () => {
    expect(() => createApp(defineComponent(() => () => h('div'))).use(FrameworkPlugin, null as never)).toThrow('[vue-framework] FrameworkPlugin requires a runtime object.')
  })

  it('rejects options with a missing runtime object', () => {
    expect(() => createApp(defineComponent(() => () => h('div'))).use(FrameworkPlugin, { runtime: null as never })).toThrow('[vue-framework] FrameworkPlugin requires a runtime object.')
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
