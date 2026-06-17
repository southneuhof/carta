import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

const servicesMock = vi.hoisted(() => ({
  list: vi.fn(),
}))

vi.mock('@/utils/services', () => ({
  default: servicesMock,
}))

import URLInput from '../URLInput.vue'

const BaseInputStub = defineComponent({
  inheritAttrs: false,
  props: {
    label: { type: String, default: '' },
    helperMessage: { type: String, default: '' },
  },
  template: `
    <div>
      <div data-testid="outer-label">{{ label }}</div>
      <div data-testid="outer-helper">{{ helperMessage }}</div>
      <slot />
    </div>
  `,
})

const DialogStub = defineComponent({
  props: { open: { type: Boolean, default: false } },
  emits: ['update:open'],
  template: `
    <div>
      <slot name="trigger" />
      <div v-if="open">
        <slot name="title" />
        <slot name="content" :setOpen="(value) => $emit('update:open', value)" />
      </div>
    </div>
  `,
})

const ButtonStub = defineComponent({
  emits: ['click'],
  inheritAttrs: false,
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
})

const IconStub = defineComponent({
  props: { name: { type: String, default: '' } },
  template: '<i :data-icon="name" />',
})

const MenuItemInputViewStub = defineComponent({
  props: {
    level: { type: Number, required: true },
    selectedId: { type: String, default: undefined },
    parentId: { type: String, default: undefined },
  },
  emits: ['update:selectedId', 'item-selected'],
  template: `
    <button
      :data-testid="'menu-level-' + level"
      @click="
        $emit('update:selectedId', 'm' + level);
        $emit('item-selected', { id: 'm' + level, slug: level === 1 ? 'parent' : 'child', name: 'Item ' + level, level });
      "
    >
      Select level {{ level }}
    </button>
  `,
})

async function mountInput(initialValue = '', extraProps: Record<string, any> = {}) {
  const model = ref<string | undefined>(initialValue || undefined)
  const wrapper = mount(URLInput, {
    props: {
      modelValue: model.value,
      label: 'Button URL',
      helperMessage: 'Select or type a URL',
      'onUpdate:modelValue': (value?: string) => {
        model.value = value
        return wrapper.setProps({ modelValue: value })
      },
      ...extraProps,
    },
    global: {
      stubs: {
        BaseInput: BaseInputStub,
        Dialog: DialogStub,
        Button: ButtonStub,
        Icon: IconStub,
        MenuItemInputView: MenuItemInputViewStub,
      },
    },
  })

  await flushPromises()
  return { wrapper, model }
}

describe('URLInput', () => {
  beforeEach(() => {
    servicesMock.list.mockReset()
    servicesMock.list.mockImplementation(async (_model: string, params: Record<string, unknown>) => {
      if (params.level === 1) return { data: [{ id: 'm1', slug: 'parent', name: 'Parent', menu_item_type: 'page' }] }
      if (params.level === 2 && params.parent_id === 'm1') return { data: [{ id: 'm2', slug: 'child', name: 'Child', menu_item_type: 'page' }] }
      return { data: [] }
    })
  })

  it('renders label/helper and updates manual input', async () => {
    const { wrapper, model } = await mountInput('')

    expect(wrapper.get('[data-testid="outer-label"]').text()).toBe('Button URL')
    expect(wrapper.get('[data-testid="outer-helper"]').text()).toBe('Select or type a URL')

    const input = wrapper.get('[data-testid="url-input-field"]')
    await input.setValue('https://example.com')

    expect(model.value).toBe('https://example.com')
  })

  it('selects a menu path into the same string field', async () => {
    const { wrapper, model } = await mountInput('')

    await wrapper.get('[data-testid="url-picker-trigger"]').trigger('click')
    await nextTick()
    await wrapper.get('[data-testid="menu-level-1"]').trigger('click')
    await wrapper.get('[data-testid="url-picker-confirm"]').trigger('click')
    await flushPromises()

    expect(model.value).toBe('/parent')
    expect((wrapper.get('[data-testid="url-input-field"]').element as HTMLInputElement).value).toBe('/parent')
  })

  it('does not try to resolve external/manual values as menu paths', async () => {
    const { wrapper } = await mountInput('mailto:test@example.com')

    expect(servicesMock.list).not.toHaveBeenCalled()
    expect((wrapper.get('[data-testid="url-input-field"]').element as HTMLInputElement).value).toBe('mailto:test@example.com')

    await wrapper.get('[data-testid="url-picker-trigger"]').trigger('click')
    await flushPromises()

    expect(servicesMock.list).not.toHaveBeenCalled()
  })

  it('respects disabled state', async () => {
    const { wrapper } = await mountInput('/parent', { disabled: true })

    expect(wrapper.get('[data-testid="url-input-field"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="url-picker-trigger"]').attributes('disabled')).toBeDefined()
  })

  it('syncs external model updates back into the text field', async () => {
    const { wrapper } = await mountInput('/parent')

    await wrapper.setProps({ modelValue: '/parent/child' })
    await flushPromises()

    expect((wrapper.get('[data-testid="url-input-field"]').element as HTMLInputElement).value).toBe('/parent/child')
  })
})
