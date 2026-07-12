import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import frameworkConfig, { defaultTableConfig } from '../../../adapters/defaults'
import {
  getInputComponentRegistry,
  registerInputComponents,
  resetInputComponentRegistryForTests,
  resolveInputComponent,
  type FrameworkInputComponent,
} from '../formInputRegistry'

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


  it('reset clears app-registered inputs but keeps built-ins', () => {
    const MoneyInput = DummyComponent('MoneyInput')
    registerInputComponents({ money: MoneyInput })
    expect(resolveInputComponent('money')).toBe(MoneyInput)

    resetInputComponentRegistryForTests()

    expect(resolveInputComponent('money')).toBeUndefined()
    expect(getInputComponentRegistry().text).toBeDefined()
  })
})
