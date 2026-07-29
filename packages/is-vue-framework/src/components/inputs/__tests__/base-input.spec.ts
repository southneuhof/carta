import { createApp, defineComponent, h, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import BaseInput from '../BaseInput.vue'

describe('BaseInput', () => {
  it('renders explicit presentation and emits one touch when focus leaves', async () => {
    const touch = vi.fn()
    const host = document.createElement('div')
    const app = createApp(defineComponent({
      setup: () => () => h(BaseInput, {
        label: 'Name',
        helperMessage: 'Help',
        error: 'Required',
        enableHelperMessage: true,
        required: true,
        'onValidation:touch': touch,
      }, () => [h('input'), h('button')]),
    }))
    app.mount(host)
    expect(host.textContent).toContain('Name')
    expect(host.textContent).toContain('*')
    expect(host.textContent).toContain('Required')
    expect(host.textContent).not.toContain('Help')

    const input = host.querySelector('input')!
    const button = host.querySelector('button')!
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: button }))
    await nextTick()
    expect(touch).not.toHaveBeenCalled()
    button.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await nextTick()
    expect(touch).toHaveBeenCalledTimes(1)
    app.unmount()
  })
})
