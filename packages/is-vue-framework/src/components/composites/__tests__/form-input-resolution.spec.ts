import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { registerInputComponents, resetInputComponentRegistryForTests, resolveInputComponent } from '../formInputRegistry'

function resolveRenderer(inputConfig: { type: string; component?: unknown }) {
  if (inputConfig.type === 'custom' && inputConfig.component) return inputConfig.component
  return resolveInputComponent(inputConfig.type)
}

describe('Form input renderer resolution compatibility', () => {
  beforeEach(() => {
    resetInputComponentRegistryForTests()
  })

  it('resolves registered component for non-custom type key', () => {
    const MoneyInput = defineComponent({
      name: 'MoneyInput',
      setup() {
        return () => null
      },
    })

    registerInputComponents({ money: MoneyInput })

    expect(resolveRenderer({ type: 'money' })).toBe(MoneyInput)
  })

  it('keeps type=custom + component behavior', () => {
    const CustomInput = defineComponent({
      name: 'CustomInput',
      setup() {
        return () => null
      },
    })

    expect(resolveRenderer({ type: 'custom', component: CustomInput })).toBe(CustomInput)
  })

  it('returns undefined for unknown type, matching warning fallback behavior', () => {
    expect(resolveRenderer({ type: 'unknown-input-type' })).toBeUndefined()
  })
})
