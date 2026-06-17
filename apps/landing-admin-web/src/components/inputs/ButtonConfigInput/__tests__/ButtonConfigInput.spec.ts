import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { registerInputComponents, resetInputComponentRegistryForTests } from '@southneuhof/is-vue-framework/renderers/inputRegistry'
import ButtonConfigInput from '../ButtonConfigInput.vue'

const BaseInputStub = defineComponent({
  inheritAttrs: false,
  template: '<div><div data-testid="outer-label">{{ label }}</div><slot /></div>',
  props: {
    label: { type: String, default: '' },
  },
})

const ButtonStub = defineComponent({
  emits: ['click'],
  inheritAttrs: false,
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /><slot name="icon" /></button>',
})

const IconStub = defineComponent({
  props: { name: { type: String, default: '' } },
  template: '<i :data-icon="name" />',
})

const UrlStub = defineComponent({
  props: {
    modelValue: { type: [String, Object], default: '' },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'validation:touch'],
  template: `
    <div>
      <div data-testid="url-label">{{ label }}</div>
      <div data-testid="url-value">{{ typeof modelValue === 'string' ? modelValue : JSON.stringify(modelValue) }}</div>
      <button data-testid="set-url" @click="$emit('update:modelValue', '/updated-url')">Set URL</button>
      <button data-testid="touch-url" @click="$emit('validation:touch')">Touch URL</button>
    </div>
  `,
})

const TextStub = defineComponent({
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'validation:touch'],
  template: `
    <div>
      <div data-testid="text-label">{{ label }}</div>
      <div data-testid="text-value">{{ modelValue }}</div>
      <button data-testid="set-text" @click="$emit('update:modelValue', 'Updated text')">Set Text</button>
      <button data-testid="touch-text" @click="$emit('validation:touch')">Touch Text</button>
    </div>
  `,
})

function mountInput(options: {
  buttonUrl?: any
  buttonText?: string
  props?: Record<string, any>
  inputConfig?: Record<string, any>
  fieldsAlias?: Record<string, string>
}) {
  const url = ref(options.buttonUrl ?? '')
  const text = ref(options.buttonText ?? '')
  const validationTouchSpy = { count: 0 }

  const Harness = defineComponent({
    setup() {
      return () =>
        h(ButtonConfigInput, {
          field: 'url',
          textField: 'url_text',
          label: 'Button',
          buttonUrl: url.value,
          buttonText: text.value,
          'onUpdate:buttonUrl': (value: any) => {
            url.value = value
          },
          'onUpdate:buttonText': (value: string) => {
            text.value = value
          },
          'onValidation:touch': () => {
            validationTouchSpy.count += 1
          },
          ...options.props,
        })
    },
  })

  const wrapper = mount(Harness, {
    global: {
      provide: {
        formInputConfig: ref(options.inputConfig ?? { url_text: { type: 'text' } }),
        formFieldsAlias: options.fieldsAlias ?? { url: 'Button URL', url_text: 'Button Text' },
      },
      stubs: {
        BaseInput: BaseInputStub,
        Button: ButtonStub,
        Icon: IconStub,
      },
    },
  })

  return { wrapper, url, text, validationTouchSpy }
}

describe('ButtonConfigInput', () => {
  registerInputComponents({ 'stub-url': UrlStub, text: TextStub })

  afterEach(() => {
    resetInputComponentRegistryForTests()
    registerInputComponents({ 'stub-url': UrlStub, text: TextStub })
  })

  it('shows empty summary by default and toggles expanded content', async () => {
    const { wrapper } = mountInput({
      props: {
        summaryPlaceholder: 'Button not configured',
        urlInputConfig: { type: 'stub-url' },
      },
    })

    expect(wrapper.text()).toContain('Button not configured')
    expect(wrapper.find('[data-testid="url-label"]').isVisible()).toBe(false)

    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-testid="url-label"]').text()).toBe('Button URL')
    expect(wrapper.find('[data-testid="text-label"]').text()).toBe('Button Text')
  })

  it('prefers button text over url in the collapsed summary', () => {
    const { wrapper } = mountInput({
      buttonUrl: '/products',
      buttonText: 'Shop now',
      props: {
        urlInputConfig: { type: 'stub-url' },
      },
    })

    expect(wrapper.text()).toContain('Shop now')
    expect(wrapper.text()).not.toContain('/updated-url')
  })

  it('falls back to url in the collapsed summary when text is empty', () => {
    const { wrapper } = mountInput({
      buttonUrl: '/products',
      props: {
        urlInputConfig: { type: 'stub-url' },
      },
    })

    expect(wrapper.text()).toContain('/products')
  })

  it('updates both named models through the inner controls', async () => {
    const { wrapper, url, text, validationTouchSpy } = mountInput({
      props: {
        urlInputConfig: { type: 'stub-url' },
      },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-testid="set-url"]').trigger('click')
    await wrapper.find('[data-testid="set-text"]').trigger('click')
    await nextTick()

    expect(url.value).toBe('/updated-url')
    expect(text.value).toBe('Updated text')
    expect(validationTouchSpy.count).toBeGreaterThanOrEqual(2)
  })

  it('reuses alias overrides and sibling field config with a text fallback', async () => {
    const { wrapper } = mountInput({
      props: {
        urlInputConfig: { type: 'stub-url' },
        urlLabelOverride: 'Link target',
        textLabelOverride: 'Label copy',
      },
      inputConfig: {},
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('[data-testid="url-label"]').text()).toBe('Link target')
    expect(wrapper.find('[data-testid="text-label"]').text()).toBe('Label copy')
  })
})
