import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, markRaw, nextTick, ref } from 'vue'
import Form from '../Form.vue'
import FormBindingTestInput from './FormBindingTestInput.vue'
import { registerInputComponents, resetInputComponentRegistryForTests } from '../../../renderers/inputRegistry'
import { resetFrameworkDefaultsForTests } from '../../../adapters/defaults'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
}))

const rawBindingTestInput = markRaw(FormBindingTestInput)

type MountOptions = {
  formProps?: Record<string, any>
  initialModel?: Record<string, any>
}

async function flushForm() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function click(container: HTMLElement, testId: string) {
  const element = container.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  if (!element) throw new Error(`Unable to find element with test id "${testId}"`)
  element.click()
}

function text(container: HTMLElement, testId: string) {
  const element = container.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  if (!element) throw new Error(`Unable to find element with test id "${testId}"`)
  return element.textContent ?? ''
}

async function mountForm({ formProps = {}, initialModel = {} }: MountOptions = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const model = ref<Record<string, any>>({ ...initialModel })

  const Host = defineComponent({
    setup() {
      return () =>
        h('div', [
          h(Form, {
            fields: ['name'],
            disabled: true,
            getInitialData: async () => ({ name: '', nameUploadState: 'pending', namePreviewOpen: false, alias: 'aliased', ...initialModel }),
            inputConfig: {
              name: {
                type: 'custom',
                component: rawBindingTestInput,
              },
            },
            modelValue: model.value,
            'onUpdate:modelValue': (value: Record<string, any>) => {
              model.value = value
            },
            ...formProps,
          }),
          h('pre', { 'data-testid': 'host-model' }, JSON.stringify(model.value)),
        ])
    },
  })

  const app = createApp(Host)
  app.mount(container)
  await flushForm()

  return {
    app,
    container,
    model,
    async cleanup() {
      app.unmount()
      container.remove()
      await nextTick()
    },
  }
}

describe('Form multi-binding compatibility', () => {
  beforeEach(() => {
    resetInputComponentRegistryForTests()
    resetFrameworkDefaultsForTests()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps legacy modelValue binding when bind is omitted', async () => {
    const mounted = await mountForm({
      initialModel: { name: 'initial-name' },
      formProps: {
        static: true,
      },
    })

    expect(text(mounted.container, 'name-modelValue')).toBe('initial-name')

    click(mounted.container, 'name-set-model')
    await flushForm()

    expect(text(mounted.container, 'name-modelValue')).toBe('updated-primary')
    expect(text(mounted.container, 'host-model')).toContain('"name":"updated-primary"')

    await mounted.cleanup()
  })

  it('binds auxiliary models to top-level formData keys', async () => {
    const mounted = await mountForm({
      initialModel: {
        name: 'initial-name',
        nameUploadState: 'queued',
        namePreviewOpen: false,
      },
      formProps: {
        static: true,
        inputConfig: {
          name: {
            type: 'custom',
            component: rawBindingTestInput,
            bind: {
              uploadState: 'nameUploadState',
              previewOpen: 'namePreviewOpen',
            },
          },
        },
      },
    })

    expect(text(mounted.container, 'name-uploadState')).toBe('queued')
    expect(text(mounted.container, 'name-previewOpen')).toBe('false')

    click(mounted.container, 'name-set-upload')
    click(mounted.container, 'name-set-preview')
    await flushForm()

    expect(text(mounted.container, 'name-uploadState')).toBe('uploaded')
    expect(text(mounted.container, 'name-previewOpen')).toBe('true')
    expect(text(mounted.container, 'host-model')).toContain('"nameUploadState":"uploaded"')
    expect(text(mounted.container, 'host-model')).toContain('"namePreviewOpen":true')

    await mounted.cleanup()
  })

  it('allows bind.modelValue to override the primary target', async () => {
    const mounted = await mountForm({
      initialModel: {
        name: 'field-name',
        alias: 'aliased-value',
      },
      formProps: {
        static: true,
        inputConfig: {
          name: {
            type: 'custom',
            component: rawBindingTestInput,
            bind: {
              modelValue: 'alias',
            },
          },
        },
      },
    })

    expect(text(mounted.container, 'name-modelValue')).toBe('aliased-value')

    click(mounted.container, 'name-set-model')
    await flushForm()

    expect(text(mounted.container, 'name-modelValue')).toBe('updated-primary')
    expect(text(mounted.container, 'host-model')).toContain('"alias":"updated-primary"')
    expect(text(mounted.container, 'host-model')).toContain('"name":"field-name"')

    await mounted.cleanup()
  })

  it('supports the same binding behavior for registry-backed inputs', async () => {
    registerInputComponents({ 'binding-test': FormBindingTestInput })

    const mounted = await mountForm({
      initialModel: {
        name: 'registry-name',
        nameUploadState: 'idle',
      },
      formProps: {
        static: true,
        inputConfig: {
          name: {
            type: 'binding-test',
            bind: {
              uploadState: 'nameUploadState',
            },
            props: {
              marker: 'registry-marker',
            },
          },
        },
      },
    })

    expect(text(mounted.container, 'name-marker')).toBe('registry-marker')
    expect(text(mounted.container, 'name-uploadState')).toBe('idle')

    click(mounted.container, 'name-set-upload')
    await flushForm()

    expect(text(mounted.container, 'name-uploadState')).toBe('uploaded')
    expect(text(mounted.container, 'host-model')).toContain('"nameUploadState":"uploaded"')

    await mounted.cleanup()
  })

  it('supports named-model-only wrappers that ignore modelValue', async () => {
    const mounted = await mountForm({
      initialModel: {
        url: '/initial-url',
        url_text: 'Initial button text',
      },
      formProps: {
        static: true,
        fields: ['url'],
        inputConfig: {
          url: {
            type: 'custom',
            component: rawBindingTestInput,
            bind: {
              buttonUrl: 'url',
              buttonText: 'url_text',
            },
          },
        },
      },
    })

    expect(text(mounted.container, 'url-buttonUrl')).toBe('/initial-url')
    expect(text(mounted.container, 'url-buttonText')).toBe('Initial button text')

    click(mounted.container, 'url-set-button-url')
    click(mounted.container, 'url-set-button-text')
    await flushForm()

    expect(text(mounted.container, 'host-model')).toContain('"url":"/updated-button-url"')
    expect(text(mounted.container, 'host-model')).toContain('"url_text":"Updated button text"')

    await mounted.cleanup()
  })

  it('preserves unrelated props and validation touch handling', async () => {
    const mounted = await mountForm({
      formProps: {
        static: true,
        fieldsAlias: {
          name: 'Display Name',
        },
        inputConfig: {
          name: {
            type: 'custom',
            component: rawBindingTestInput,
            props: {
              marker: 'custom-marker',
              required: true,
              helperMessage: 'Helpful message',
            },
          },
        },
      },
    })

    expect(text(mounted.container, 'name-marker')).toBe('custom-marker')
    expect(mounted.container.textContent).toContain('Display Name')
    expect(mounted.container.textContent).toContain('Helpful message')

    click(mounted.container, 'name-touch')
    await flushForm()

    expect(mounted.container.textContent).toContain('Harus diisi!')

    await mounted.cleanup()
  })
})
