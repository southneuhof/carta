import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { getFrameworkBehaviors } from '../../../adapters/behaviors'
import frameworkConfig, { defaultTableConfig } from '../../../adapters/defaults'
import {
  getInputComponentRegistry,
  registerInputComponents,
  resetInputComponentRegistryForTests,
  resolveInputComponent,
  type FrameworkInputComponent,
} from '../formInputRegistry'
import { createFrameworkPlugin } from '../../../adapters/plugin'

describe('input registry', () => {
  const DummyComponent = (name: string) =>
    defineComponent({
      name,
      setup() {
        return () => null
      },
    })

  beforeEach(() => {
    resetInputComponentRegistryForTests()
  })

  it('still resolves built-in renderer for text', () => {
    expect(resolveInputComponent('text')).toBeDefined()
  })

  it('resolves built-in renderer for color', () => {
    expect(resolveInputComponent('color')).toBeDefined()
  })

  it('resolves registered direct component by custom key', () => {
    const MoneyInput = DummyComponent('MoneyInput')
    registerInputComponents({ money: MoneyInput })

    expect(resolveInputComponent('money')).toBe(MoneyInput)
  })

  it('normalizes async loader using defineAsyncComponent', () => {
    const AsyncInput = DummyComponent('AsyncInput')
    const loader: FrameworkInputComponent = async () => AsyncInput

    registerInputComponents({ 'user-picker': loader })

    const resolved = resolveInputComponent('user-picker') as { __asyncLoader?: unknown }
    expect(resolved).toBeDefined()
    expect((resolved as any).__asyncLoader).toBeTypeOf('function')
  })

  it('later plugin registration overrides earlier renderer with same key', () => {
    const FirstMoneyInput = DummyComponent('FirstMoneyInput')
    const SecondMoneyInput = DummyComponent('SecondMoneyInput')

    const app = createApp(DummyComponent('AppRoot'))
    app.use(createFrameworkPlugin({ extension: { inputs: { money: FirstMoneyInput } } }))
    app.use(createFrameworkPlugin({ extension: { inputs: { money: SecondMoneyInput } } }))

    expect(resolveInputComponent('money')).toBe(SecondMoneyInput)
  })

  it('plugin install configures extension, config, defaults, and behaviors in one use call', () => {
    const app = createApp(DummyComponent('AppRoot'))
    const MoneyInput = DummyComponent('MoneyInput')
    const getData = async () => ({ data: [], total: 0, totalPage: 0 })

    app.use(
      createFrameworkPlugin({
        extension: { inputs: { money: MoneyInput } },
        config: { apiUrl: 'https://api.example.com/' },
        defaults: { table: { fieldsAlias: { money: 'Money' } } },
        behaviors: { table: { getData } },
      }),
    )

    expect(resolveInputComponent('money')).toBe(MoneyInput)
    expect(frameworkConfig.apiUrl).toBe('https://api.example.com/')
    expect(defaultTableConfig.fieldsAlias.money).toBe('Money')
    expect(getFrameworkBehaviors().table?.getData).toBe(getData)
  })

  it('reset clears app-registered inputs but keeps built-ins', () => {
    const MoneyInput = DummyComponent('MoneyInput')
    registerInputComponents({ money: MoneyInput })
    expect(resolveInputComponent('money')).toBe(MoneyInput)

    resetInputComponentRegistryForTests()

    expect(resolveInputComponent('money')).toBeUndefined()
    expect(getInputComponentRegistry().text).toBeDefined()
  })
})
